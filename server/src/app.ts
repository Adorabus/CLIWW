import * as express from 'express'
import * as http from 'http'
import * as socketIO from 'socket.io'
import * as bodyParser from 'body-parser'
import Wrapper from './wrapper'
import Messenger from './messenger'
import { AddressInfo } from 'net'
import router from './router'
import database from './database'

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

router(app, messenger)
console.log('Opening connection to database...')
database()
  .then(() => {
    console.log('Connection to database established.')
    server.listen(process.env.PORT || 8999, () => {
      const addrInfo = server.address() as AddressInfo
      console.log(`Listening on port ${addrInfo.port}.`)
    })
  })
  .catch((err) => {
    console.error(err)
  })
