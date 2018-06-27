import * as express from 'express'
import * as http from 'http'
import * as socketIO from 'socket.io'
import * as bodyParser from 'body-parser'

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

app.use(bodyParser.json())

io.on('connection', (client: socketIO.Socket) => {
  console.log(`Connection from: ${client.client.conn.remoteAddress}`)
  client.on('command', (data) => {
    io.emit('message', `${client.id}: ${data}`)
  })
  client.on('disconnect', () => {
    console.log(`${client.id} disconnected.`)
  })
})

server.listen(process.env.PORT || 8999, () => {
  const addrInfo = server.address()
  console.log(addrInfo)
})
