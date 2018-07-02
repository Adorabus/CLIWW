import * as http from 'http'
import * as socketIO from 'socket.io'
import {Wrapper, WrapperOptions} from './wrapper'
import {Messenger, MessengerOptions} from './messenger'
import {AddressInfo} from 'net'
import * as yargs from 'yargs'

const argv = yargs
  .usage('Usage: $0 [options] <command>')
  .option('password', {
    describe: 'Console access password.'
  })
  .option('limit', {
    describe: 'Maximum stored messages. (Default: Unlimited)',
    type: 'number'
  })
  .boolean('keepalive')
  .describe('keepalive', 'Restart the process if it exits.')
  .demandCommand(1, 'No command specified.')
  .argv

const server = http.createServer()
const io = socketIO(server)

const command = argv._.shift() as string
const wrapper = new Wrapper(command, argv._, argv as WrapperOptions)
const messenger = new Messenger(io, wrapper, argv as MessengerOptions)
wrapper.startProcess()

server.listen(process.env.PORT || 8999, () => {
  const addrInfo = server.address() as AddressInfo
  console.log(`Listening on port ${addrInfo.port}.`)
})
