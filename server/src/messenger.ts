import * as SocketIO from 'socket.io'
import {Wrapper} from './wrapper'
import {ChildProcess} from 'child_process'

export enum MessageType {
  Plain,
  Error,
  Command,
  Info
}

export interface Message {
  content: string
  type: MessageType
}

export interface MessengerOptions {
  password?: string
}

function minutesAgo (timestamp: number) {
  return (Date.now() - timestamp) / 1000 / 60
}

export class Messenger {
  private io: SocketIO.Server
  private wrapper: Wrapper
  private options: MessengerOptions
  private failedAuths: {[index: string] : number[]} = {}
  private bans: {[index: string] : number} = {}
  messages: Message[] = []

  constructor (io: SocketIO.Server, wrapper: Wrapper, options: MessengerOptions = {}) {
    this.io = io
    this.wrapper = wrapper
    this.options = options
    io.on('connection', (client: SocketIO.Socket) => {
      const ipAddr = client.client.conn.remoteAddress
      this.log(`Connection from [${ipAddr}].`)
      client.emit('authrequest')

      client.on('auth', (password) => {
        if (this.auth(client, password)) {
          client.join('authorized')
          client.emit('authsuccess', {
            messages: this.messages,
            isAlive: this.wrapper.isAlive()
          })
          this.log(`[${ipAddr}] authenticated.`)
        } else {
          client.emit('authfail')
        }
      })

      client.on('command', (command) => {
        if (!('authorized' in client.rooms)) {
          client.emit('authrequest')
          return
        }
        if (command.trim().length === 0) return

        this.broadcastMessage({
          content: `[${ipAddr}]> ${command}`,
          type: MessageType.Command
        })

        if (!this.wrapper.send(`${command}\n`)) {
          this.broadcastMessage({
            content: 'Server is not running!',
            type: MessageType.Error
          })
        }
      })

      client.on('disconnect', () => {
        this.log(`${ipAddr} disconnected.`)
      })
    })

    wrapper.on('start', (wrapped: ChildProcess) => {
      wrapped.stdout
        .on('data', (data) => {
          this.broadcastMessage({
            content: data as string,
            type: MessageType.Plain
          })
        })

      wrapped.stderr
        .on('data', (data) => {
          this.broadcastMessage({
            content: data as string,
            type: MessageType.Plain
          })
        })

      wrapped
        .on('exit', (code) => {
          this.broadcast('serverstop')
          if (code === 0) {
            this.broadcastMessage({
              content: 'The server has exited.',
              type: MessageType.Info
            })
          } else {
            this.broadcastMessage({
              content: `The server has crashed. [Code ${code}]`,
              type: MessageType.Error
            })
          }
        })
    })

    wrapper.on('message', (content: string) => {
      this.log(content)
      this.broadcastMessage({
        content,
        type: MessageType.Info
      })
    })
  }

  auth (client: SocketIO.Socket, password: string) {
    if (!this.options.password) return true
    const ip = client.client.conn.remoteAddress

    // are they banned?
    if (ip in this.bans && minutesAgo(this.bans[ip]) < 10) {
      return false
    }

    // check password
    if (password === this.options.password) {
      return true
    }

    // make space to store failed attempts
    if (!this.failedAuths[ip]) this.failedAuths[ip] = []

    this.failedAuths[ip].push(Date.now())

    // keep only failed auths from the last minute
    this.failedAuths[ip] = this.failedAuths[ip].filter(failTime => minutesAgo(failTime) < 1)
    if (this.failedAuths[ip].length > 5) {
      this.bans[ip] = Date.now()
      const banMessage = `Client [${ip}] has been banned for 10 minutes.`
      this.log(banMessage)
      this.broadcastMessage({
        content: banMessage,
        type: MessageType.Info
      })
    }
  }

  broadcastMessage (message: Message) {
    this.messages.push(message)
    this.io.sockets.in('authorized').emit('message', message)
  }

  broadcast (event: string, data?: any) {
    this.io.sockets.in('authorized').emit(event, data)
  }

  private log (...args: any[]) {
    console.log(...args)
  }
}
