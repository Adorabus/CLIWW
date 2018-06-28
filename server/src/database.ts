import {createConnection, ConnectionOptions} from 'typeorm'
import config from './config'

export default () => {
  return createConnection(config.db as ConnectionOptions)
}
