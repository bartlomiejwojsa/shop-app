import bcrypt from 'bcryptjs'

import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { body, check } from 'express-validator'
import { User } from '../models/user'
import express, {
  Request,
  Response,
  NextFunction,
} from 'express'
import { validationResult } from 'express-validator'
import csrf from 'csurf'
import { generateApiKey } from 'generate-api-key';

const csrfProtection = csrf( { cookie: true })

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_SENDER,
    pass: process.env.MAIL_SECRET,
  },
  logger: true
})

class AuthController {
  public path = '/'
  public router = express.Router()

  constructor() {
    this.initializeRouter()
  }

  private initializeRouter = () => {
    this.router.get(
      '/login',
      csrfProtection,
      this.getLogin
    )
    this.router.post(
      '/login',
      csrfProtection,
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
    this.router.get(
      '/signup',
      csrfProtection,
      this.getSignup
    )
    this.router.post(
      '/signup',
      csrfProtection,
      [
        check('email')
          .isEmail()
          .withMessage('Please enter a valid email.')
          .custom((value) => {
            // if (value === 'test@test.com') {
            //   throw new Error('This email address if forbidden.');
            // }
            // return true;
            return User.findOne({ email: value }).then(
              (userDoc) => {
                if (userDoc) {
                  return Promise.reject(
                    'E-Mail exists already, please pick a different one.'
                  )
                }
              }
            )
          }),
        body(
          'password',
          'Please enter a password with only numbers and text and at least 5 characters.'
        )
          .isLength({ min: 5 })
          .isAlphanumeric()
          .trim(),
        body('confirmPassword')
          .trim()
          .custom((value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('Passwords have to match!')
            }
            return true
          }),
      ],
      this.postSignup
    )
    this.router.post(
      '/logout',
      this.postLogout
    )
    this.router.get(
      '/reset',
      csrfProtection,
      this.getReset
    )
    this.router.post(
      '/reset',
      csrfProtection,
      this.postReset
    )
    this.router.get(
      '/reset/:token',
      csrfProtection,
      this.getNewPassword
    )
    this.router.post(
      '/new-password',
      csrfProtection,
      this.postNewPassword
    )
  }

  getLogin = (req: Request, res: Response): void => {
    res.locals.csrfToken = req.csrfToken()
    let messages = req.flash('error')
    let message: string | null = ''
    if (messages.length > 0) {
      message = messages[0]
    } else {
      message = null
    }
    res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: message,
      oldInput: {
        email: '',
        password: '',
      },
      validationErrors: [],
    })
  }

  postLogin = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const email = req.body.email
    const password = req.body.password

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.locals.csrfToken = req.csrfToken()
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errors.array()[0].msg,
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: errors.array(),
      })
    }
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          res.locals.csrfToken = req.csrfToken()
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [],
          })
        }
        bcrypt
          .compare(password, user.password)
          .then((doMatch) => {
            if (doMatch) {
              req.session.isLoggedIn = true
              req.session.user = user
              return req.session.save((_err) => {
                res.redirect('/')
              })
            }
            res.locals.csrfToken = req.csrfToken()
            return res.status(422).render('auth/login', {
              path: '/login',
              pageTitle: 'Login',
              errorMessage: 'Invalid email or password.',
              oldInput: {
                email: email,
                password: password,
              },
              validationErrors: [],
            })
          })
          .catch((_err) => {
            res.redirect('/login')
          })
      })
      .catch((err) => {
        const error = new Error(err)
        // error.httpStatusCode = 500;
        return next(error)
      })
  }

  getSignup = (req: Request, res: Response): void => {
    res.locals.csrfToken = req.csrfToken()
    let messages = req.flash('error')
    let message: string | null = ''
    if (messages.length > 0) {
      message = messages[0]
    } else {
      message = null
    }
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: message,
      oldInput: {
        email: '',
        password: '',
        confirmPassword: '',
      },
      validationErrors: [],
    })
  }
  
  postSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const email = req.body.email
    const password = req.body.password

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.locals.csrfToken = req.csrfToken()
      return res.status(422).render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: errors.array()[0].msg,
        oldInput: {
          email: email,
          password: password,
          confirmPassword: req.body.confirmPassword,
        },
        validationErrors: errors.array(),
      })
    }
    try {
      const hashedPass = await bcrypt.hash(password, 12)
      const newUser = new User({
        email: email,
        password: hashedPass,
        apiKey: generateApiKey(),
        coins: 0,
        cart: { items: [] },
      })
      await newUser.save()
      const mailOpts = {
        to: email,
        subject: 'Signup succeeded!',
        html: `<h1>You successfully signed up!</h1>
              <img src='https://streetwear.pl/wp-content/uploads/2019/11/bezpieczne-zakupy-w-grupach-streetwear-560x420.jpg'>
              `,
      }
      transporter.sendMail(mailOpts)
      res.redirect('/login')
    } catch (err) {
      return next(err)
    }
  }

  postLogout = (req: Request, res: Response): void => {
    req.session.destroy((_err) => {
      res.redirect('/')
    })
  }

  getReset = (req: Request, res: Response): void => {
    res.locals.csrfToken = req.csrfToken()
    let messages = req.flash('error')
    let message: string | null = ''
    if (messages.length > 0) {
      message = messages[0]
    } else {
      message = null
    }
    res.render('auth/reset', {
      path: '/reset',
      pageTitle: 'Reset Password',
      errorMessage: message,
    })
  }

  postReset = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        return res.redirect('/reset')
      }
      const token = buffer.toString('hex')
      const user = await User.findOne({
        email: req.body.email,
      })
      if (user) {
        try {
          user.resetToken = token
          user.resetTokenExpiration = Date.now() + 3600000
          await user.save()
          var adress = `http://localhost:${process.env.PORT}`
          if (process.env.IS_GLITCH_SERVER) {
            adress = `https://${process.env.PROJECT_DOMAIN}.glitch.me`
          }

          transporter.sendMail({
            to: req.body.email,
            subject: 'Password reset',
            html: `
              <p>You requested a password reset</p>
              <p>Click this <a href="${adress}/reset/${token}">link</a> to set a new password.</p>
            `,
          })
          res.redirect('/')
        } catch (err) {
          return next(err)
        }
      } else {
        req.flash(
          'error',
          'No account with that email found.'
        )
        return res.redirect('/reset')
      }
    })
  }

  getNewPassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    res.locals.csrfToken = req.csrfToken()
    const token = req.params.token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    })
    if (user) {
      let messages = req.flash('error')
      let message: string | null = ''
      if (messages.length > 0) {
        message = messages[0]
      } else {
        message = null
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      })
    } else {
      req.flash(
        'error',
        'Unknown token or already expired.'
      )
      return res.redirect('/reset')
    }
  }

  postNewPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const newPassword = req.body.password
    const userId = req.body.userId
    const passwordToken = req.body.passwordToken
    
    const resetUser = await User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId,
    })
    if (resetUser) {
      try {
        const newPassHashed = await bcrypt.hash(newPassword, 12)
        resetUser.password = newPassHashed;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        await resetUser.save()
        res.redirect('/login')
      } catch (err) {
        return next(err)
      }
    } else {
      req.flash(
        'error',
        'Unknown token or already expired.'
      )
      return res.redirect('/reset')
    }
  }
}

export default AuthController
