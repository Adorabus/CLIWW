import {Express} from 'express'
import Messenger from './messenger'
import UsersController from './controllers/UsersController'

export default (app: Express, messenger: Messenger) => {
  app.get('/console', (req, res) => {
    res.send({
      messages: messenger.messages
    })
  })
  app.post('/users', UsersController.createUser)
  app.put('/users/:username', UsersController.renameUser)
}
