import * as express from 'express'
import Messenger from './messenger'

export default (app: express.Express, messenger: Messenger) => {
  app.get('/console', (req, res) => {
    res.send({
      messages: messenger.messages
    })
  })
}
