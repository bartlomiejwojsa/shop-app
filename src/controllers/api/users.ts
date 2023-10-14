import { body, check } from 'express-validator'
import { User } from '../../models/user'
import express, {
  Request,
  Response,
  NextFunction,
} from 'express'
import { validationResult } from 'express-validator'




class APIUsersController {
  public path = '/api/users'
  public router = express.Router()

  constructor() {
    this.initializeRouter()
  }

  private initializeRouter = () => {
    this.router.get(
      '/user',
      this.getUser
    )
  }

  getUser = (req: Request, res: Response): void => {
    const token = req.query.token;
    if (token) {
      console.log("getting user", token)
      User.findOne({ token: token })
        .then((user) => {
          if (!user) {
            return res.status(422).end(JSON.stringify({
              success: false,
              message: "User with provided token does not exists"
            }))
          }
          if (user.imageUrl.length > 0) {
            var adress = `http://localhost:${process.env.PORT}`
            if (process.env.IS_GLITCH_SERVER === "true") {
              adress = `https://${process.env.PROJECT_DOMAIN}.glitch.me`
            }
            user.imageUrl = `${adress}/${user.imageUrl}`
          }

          return res.status(200).end(JSON.stringify({
            success: true,
            message: "User fetched successfuly",
            user: user
          }))
        })
        .catch((_err) => {
          return res.status(500).end(JSON.stringify({
            success: false,
            message: "Internal server error. Contact admin"
          }))
        })
    } else {
      res.status(500).end(JSON.stringify({
        success: false,
        message: "Internal server error. Contact admin"
      }))
    }
  }
}

export default APIUsersController
