import * as express from 'express'
import * as http from 'http'
import * as socketIO from 'socket.io'
import * as bodyParser from 'body-parser'
import Wrapper from './wrapper'
import Messenger from './messenger'
import {AddressInfo} from 'net'

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

app.use(bodyParser.json())

const idx = process.argv.indexOf('--cmd')
if (idx === -1) {
  console.error('Missing launch command! (--cmd command [arg1, ...])')
  process.exit(1)
}

const args = process.argv.splice(idx + 1, process.argv.length) as string[]
const command = args.shift() as string

const wrapper = new Wrapper({command, args})
const messenger = new Messenger(io, wrapper)

app.get('/console', (req, res) => {
  res.send({
    messages: messenger.messages
  })
})

server.listen(process.env.PORT || 8999, () => {
  const addrInfo = server.address() as AddressInfo
  console.log(`Listening on port ${addrInfo.port}.`)
})
