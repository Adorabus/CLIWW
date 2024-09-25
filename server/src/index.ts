require('dotenv').config()
import { Server } from 'socket.io'
import * as express from 'express'
import { Wrapper } from './wrapper'
import { Messenger, MessengerOptions } from './messenger'
import { AddressInfo } from 'net'
import * as minimist from 'minimist'
import * as path from 'path'
import * as fs from 'fs'
import { setOptions, SetServerOptions } from './server-options'

const argv = minimist(process.argv.slice(2), {'stopEarly': true})
const app = express()
let server: any

const {key, cert} = process.env
if (key && cert) {
  try {
    server = require('https').createServer({
      key: fs.readFileSync(key),
      cert: fs.readFileSync(cert)
    }, app)
    console.log('Starting using https...')
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
} else {
  console.log('Starting using http...')
  server = require('http').createServer(app)
}

app.use(express.static(path.join(__dirname, 'public')))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
  }
})

const command = argv._.shift() as string

if (!command) {
  console.log('Usage: cliww [OPTIONS] command...')
  console.log(`Options
  --password PASSWORD
  --limit MAXIMUM
  --port PORT
  --keepalive`)
  process.exit(1)
}

// set defaults
setOptions(argv as SetServerOptions)

const wrapper = new Wrapper(command, argv._)
const messenger = new Messenger(io, wrapper, argv as MessengerOptions)
wrapper.startProcess()

server.listen(argv.port || 8999, () => {
  const addrInfo = server.address() as AddressInfo
  console.log(`Listening on port ${addrInfo.port}.`)
})
