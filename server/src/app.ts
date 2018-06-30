import * as http from 'http'
import * as socketIO from 'socket.io'
import Wrapper from './wrapper'
import {Messenger, MessengerOptions} from './messenger'
import {AddressInfo} from 'net'
import * as yargs from 'yargs'

const argv = yargs
  .usage('Usage: $0 [options] <command>')
  .option('password', {
    alias: 'p',
    describe: 'Console access password.'
  })
  .boolean('v')
  .alias('v', 'verbose')
  .describe('v', 'Display additional information.')
  .demandCommand(1, 'No command specified.')
  .argv

const server = http.createServer()
const io = socketIO(server)

const command = argv._.shift() as string
const wrapper = new Wrapper({
  command,
  args: argv._
})
const messenger = new Messenger(io, wrapper, argv as MessengerOptions)

server.listen(process.env.PORT || 8999, () => {
  const addrInfo = server.address() as AddressInfo
  console.log(`Listening on port ${addrInfo.port}.`)
})
