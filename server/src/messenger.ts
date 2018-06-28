import * as SocketIO from 'socket.io'
import Wrapper from './wrapper'

enum MessageType {
  Plain,
  Error,
  Command
}

interface Message {
  content: string
  type: MessageType
}

export default class Messenger {
  private io: SocketIO.Server
  private wrapper: Wrapper
  messages: Message[] = []

  constructor (io: SocketIO.Server, wrapper: Wrapper) {
    this.io = io
    this.wrapper = wrapper

    io.on('connection', (client: SocketIO.Socket) => {
      const ipAddr = client.client.conn.remoteAddress
      console.log(`Connection from: ${ipAddr}`)

      client.on('command', (data) => {
        if (data.trim().length === 0) return

        this.broadcast({
          content: `[${ipAddr}]> ${data}`,
          type: MessageType.Command
        })

        if (!this.wrapper.send(`${data}\n`)) {
          this.broadcast({
            content: 'Server is not running!',
            type: MessageType.Error
          })
        }
      })

      client.on('disconnect', () => {
        console.log(`${client.id} disconnected.`)
      })
    })

    wrapper.wrapped.stdout
      .on('data', (data) => {
        this.broadcast({
          content: data as string,
          type: MessageType.Plain
        })
      })

    wrapper.wrapped.stderr
      .on('data', (data) => {
        this.broadcast({
          content: data as string,
          type: MessageType.Plain
        })
      })
  }

  broadcast (message: Message) {
    this.messages.push(message)
    this.io.emit('message', message)
  }
}
