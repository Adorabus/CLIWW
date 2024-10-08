import {Socket, Server} from 'socket.io'
import {Wrapper} from './wrapper'
import {ChildProcess} from 'child_process'
import {minutesAgo} from './util'
import { getOptions, setOptions } from './server-options'

declare module 'socket.io' {
  interface Socket {
    nickname?: string
  }
}

export enum MessageType {
  Plain,
  Error,
  Command,
  Info,
  StdErr
}

export interface Message {
  content: string
  type: MessageType
}

export interface SentMessage extends Message {
  id: number
}

export interface MessengerOptions {
  password?: string
  limit?: number
}

function validNickname (nickname: string) {
  if (!nickname) return false
  return !(nickname.length < 1 || nickname.length > 16)
}

export class Messenger {
  private nextId = 0
  private io: Server
  private wrapper: Wrapper
  private options: MessengerOptions
  private failedAuths: {[index: string] : number[]} = {}
  private bans: {[index: string] : number} = {}
  messages: SentMessage[] = []

  constructor (io: Server, wrapper: Wrapper, options: MessengerOptions = {}) {
    this.io = io
    this.wrapper = wrapper
    this.options = options
    io.on('connection', (client: Socket) => {
      const ipAddr = client.client.conn.remoteAddress
      this.log(`Connection from [${ipAddr}].`)

      client.on('auth', (password) => {
        if (this.auth(client, password)) {
          client.join('authorized')
          client.emit('authsuccess')
          client.emit('serverstate', {
            isAlive: this.wrapper.isAlive(),
            messageLimit: options.limit || 0,
          })
          client.emit('serveroptions', getOptions())
          client.emit('messagehistory', {
            messages: this.messages
          })
          this.log(`[${ipAddr}] authenticated.`)
        } else {
          client.emit('authfail')
        }
      })

      client.on('nickname', (nickname) => {
        if (!validNickname(nickname)) {
          delete client.nickname
          return
        }
        client.nickname = nickname
      })

      client.on('setoptions', (data) => {
        if (!client.rooms.has('authorized')) {
          client.emit('authrequest')
          return
        }

        setOptions(data)
        this.broadcast('serveroptions', getOptions())
      })

      client.on('restart', () => {
        if (!client.rooms.has('authorized')) {
          client.emit('authrequest')
          return
        }

        this.wrapper.startProcess()
      })

      client.on('command', (command) => {
        if (!client.rooms.has('authorized')) {
          client.emit('authrequest')
          return
        }

        this.broadcastMessage({
          content: `[${client.nickname || ipAddr}]> ${command}`,
          type: MessageType.Command
        })

        // manual restart command if crashed
        if (command === 'rs' && !this.wrapper.isAlive()) {
          this.broadcastMessage({
            content: 'Server manually restarted...',
            type: MessageType.Info
          })

          this.wrapper.startProcess()

          return
        }

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
      if (!wrapped.stdout || !wrapped.stderr) {
        throw new Error('Failed to wrap child process...')
      }

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
            type: MessageType.StdErr
          })
        })

        this.broadcastMessage({
          content: 'Process started.',
          type: MessageType.Info
        }, true)

      this.broadcast('serverstate', {
        isAlive: true
      })
    })

    wrapper
      .on('exit', (code) => {
        this.broadcast('serverstate', {
          isAlive: false
        })
        if (code === 0) {
          this.broadcastMessage({
            content: 'The server has exited.\nType rs to restart it.',
            type: MessageType.Info
          }, true)
        } else if (code === null) {
          this.broadcastMessage({
            content: 'The server was forcibly stopped.',
            type: MessageType.Info
          }, true)
        } else {
          this.broadcastMessage({
            content: `The server has crashed. [Code ${code}]\nType rs to restart it.`,
            type: MessageType.Error
          }, true)
        }
      })

    wrapper
      .on('message', (content: string) => {
        this.broadcastMessage({
          content,
          type: MessageType.Info
        }, true)
      })
  }

  auth (client: Socket, password: string) {
    if (!this.options.password) return true
    const ip = client.client.conn.remoteAddress

    // are they banned?
    if (this.bans[ip] && minutesAgo(this.bans[ip]) < 10) {
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
      this.broadcastMessage({
        content: `Client [${ip}] has been banned for 10 minutes.`,
        type: MessageType.Info
      }, true)
    }
  }

  broadcastMessage (message: Message, log?: boolean) {
    const id = this.nextId++
    const sentMessage = {...message, id}

    if (this.options.limit && this.options.limit > 0) {
      if (this.messages.length === this.options.limit) {
        this.messages.shift()
      }
    }
    this.messages.push(sentMessage)
    this.io.sockets.in('authorized').emit('message', sentMessage)
    if (log) {
      this.log(message.content)
    }
  }

  broadcast (event: string, data?: any) {
    this.io.sockets.in('authorized').emit(event, data)
  }

  private log (...args: any[]) {
    console.log(...args)
  }
}
