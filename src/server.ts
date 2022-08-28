import './config'
import App from './app'
import { Request, Response, NextFunction } from 'express'
// import mongodbStore from './middleware/mongodb-store';
import csrf from 'csurf'
import flash from 'connect-flash'
import basicAuth from './middleware/basic-auth'
import bodyParser from 'body-parser'
import connectMongoSession from './middleware/mongodb-store'

import ErrorController from './controllers/error'
import ShopController from './controllers/shop'
import AuthController from './controllers/auth'

const app = new App(
  [
    bodyParser.urlencoded({ extended: false }),
    connectMongoSession(),
    csrf(),
    (req: Request, res: Response, next: NextFunction) => {
      let isLoggedIn = req.session?.isLoggedIn ?? false
      res.locals.isAuthenticated = isLoggedIn
      res.locals.csrfToken = req.csrfToken()
      next()
    },
    flash(),
    basicAuth,
  ],
  [
    new AuthController(),
    new ErrorController(),
    new ShopController(),
  ]
)

app.listen()
