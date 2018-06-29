import {Request, Response} from 'express'
import User from '../entity/User'

export default {
  async createUser (req: Request, res: Response) {
    const {username} = req.body

    try {
      const u = new User()
      u.username = req.body.username
      u.password = req.body.password
      await u.save()

      res.send(u)
    } catch (error) {
      console.error(error)
      res.status(409).send({
        error: `User "${username}" already exists.`
      })
    }
  },
  async renameUser (req: Request, res: Response) {
    const {username} = req.params

    try {
      const u = await User.findOne({
        username
      }) as User
      u.username = req.body.newName
      u.save()

      res.send(u)
    } catch (error) {
      res.status(404).send({
        error: `User "${username} not found.`
      })
    }
  }
}
