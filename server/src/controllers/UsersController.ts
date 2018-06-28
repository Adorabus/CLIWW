import {Request, Response} from 'express'
import {User} from 'entity/User'

export default {
  async createUser (req: Request, res: Response) {
    const {username} = req.body

    try {
      const u = new User()
      u.username = req.body.username
      await u.save()

      res.send(u)
    } catch (error) {
      res.status(409).send({
        error: `User "${username}" already exists.`
      })
    }
  }
}
