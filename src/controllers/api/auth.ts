import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken';

// import { body, check } from 'express-validator'
import { body } from 'express-validator'

import { User } from '../../models/user'
import express, {
  Request,
  Response,
} from 'express'
import { validationResult } from 'express-validator'


class APIAuthController {
  public path = '/api/auth'
  public router = express.Router()

  constructor() {
    this.initializeRouter()
  }

  private initializeRouter = () => {
    this.router.post(
      '/login',
      [
        body('email')
          .isEmail()
          .withMessage(
            'Please enter a valid email address.'
          ),
        body('password', 'Password has to be valid.')
          .isLength({ min: 5 })
          .isAlphanumeric()
          .trim(),
      ],
      this.postLogin
    )
  }

  postLogin = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const email = req.body.email
      const password = req.body.password
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log(errors)
        res.status(422).end(JSON.stringify({
          success: false,
          message: "Invalid email or password"
        }))
        return
      }
      const user = await User.findOne({ email: email })
      if (user) {
        const result = await bcrypt
          .compare(password, user!.password)
        if (result) {
          // encode jwt token
          const token = jwt.sign({
            userId: user.id
          }, process.env.JWT_SECRET_KEY!)
          console.log(token)
          //
          req.session.isLoggedIn = true
          req.session.user = user
          req.session.save()
          user.token = token
          user.save()
          res.status(200).end(JSON.stringify({
            success: true,
            message: token
          }))
          return
        }
      }
      res.status(422).end(JSON.stringify({
        success: false,
        message: "Invalid email or password"
      }))
    } catch (err) {
      console.log(err)
      res.status(500).end(JSON.stringify({
        success: false,
        message: "Internal server error. Contact admin"
      }))
    }
  }
  

  postLogout = (req: Request, res: Response): void => {
    req.session.destroy((_err) => {
      res.redirect('/')
    })
  }
  
}

export default APIAuthController
