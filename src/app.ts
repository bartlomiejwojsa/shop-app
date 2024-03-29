import express, { Application } from 'express';
import mongoose from 'mongoose';
import './config'

import { Request, Response, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import flash from 'connect-flash'
import basicAuth from './middleware/basic-auth'
import bodyParser from 'body-parser'
import ErrorController from './controllers/app/error'
import ShopController from './controllers/app/shop'
import AuthController from './controllers/app/auth'
import AdminController from './controllers/app/admin'

import APIAdminController from './controllers/api/admin'

import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';

import { mongoURI, mongoSessionKey } from './util/index';
import APIAuthController from './controllers/api/auth';
import APIUsersController from './controllers/api/users';
import APIProductsController from './controllers/api/products';

//https://akoskm.com/how-to-use-express-session-with-custom-sessiondata-typescript
declare module 'express-session' {
  // eslint-disable-next-line no-unused-vars
  interface SessionData {
    isLoggedIn?: boolean | undefined;
  }
}

class App {
  public app: Application
  public port: number

  constructor() {
    this.app = express()
    this.port = +process.env.PORT!;

    this.useAssets();
    this.setTemplates();
    this.loadMiddlewares();
    this.loadRoutes();
    this.loadUnknownHandler();
  }

  // eslint-disable-next-line no-unused-vars
  private loadMiddlewares() {
      this.app.use(bodyParser.urlencoded({ extended: false }))
      this.app.use(bodyParser.json())

      this.app.use(cookieParser())

      const MongoDBStore = connectMongoDBSession(session);

      const store = new MongoDBStore({
        uri: String(mongoURI ?? ""),
        collection: 'sessions'
      });

      this.app.use(session({
        name: mongoSessionKey,
        secret: mongoSessionKey,
        resave: false,
        saveUninitialized: false,
        store: store
      }))
      this.app.use(flash())
      this.app.use(basicAuth)
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        let isLoggedIn = req.session?.isLoggedIn ?? false
        res.locals.isAuthenticated = isLoggedIn
        let coins = req.session?.user?.coins ?? -1
        res.locals.coins = coins
        next()
      })
  }

  // eslint-disable-next-line no-unused-vars
  private loadRoutes() {
    const adminController = new AdminController()
    const authController = new AuthController()
    const errorController = new ErrorController()
    const shopController = new ShopController()

    const apiAdminController = new APIAdminController()
    const apiAuthController = new APIAuthController()
    const apiUsersController = new APIUsersController()
    const apiProductsController = new APIProductsController()

    this.app.use(adminController.path, adminController.router)
    this.app.use(authController.path, authController.router)
    this.app.use(errorController.path, errorController.router)
    this.app.use(shopController.path, shopController.router)

    this.app.use(apiAdminController.path, apiAdminController.router)
    this.app.use(apiAuthController.path, apiAuthController.router)
    this.app.use(apiUsersController.path, apiUsersController.router)
    this.app.use(apiProductsController.path, apiProductsController.router)
  }

  private useAssets() {
    this.app.use(express.static('public'));
    this.app.use(express.static('views'));
    this.app.use('/images', express.static('images'));
  }

  private setTemplates() {
    this.app.set('view engine', 'ejs');
    this.app.set('views', 'views');
  }
  
  private loadUnknownHandler() {
    // eslint-disable-next-line no-unused-vars
    this.app.use((_error: any, req: any, res: any, _next: any) => {
      console.log("None of routes was able handle this request",_error)
      let isLoggedIn = req.session?.isLoggedIn ?? false;
      res.status(500).render('500', {
        pageTitle: 'Err',
        path: '/500',
        isAuthenticated: isLoggedIn,
      });
    });
  }

  public listen() {
    if (mongoURI) {
        mongoose
          .connect(String(mongoURI ?? ""))
          .catch( err => {
            if (err) {
              throw new Error(`Couldnt connect to database, ${String(err)}`);
            }
          })
        this.app.listen(this.port, () => {
          console.log(`App listening on the http://localhost:${this.port}`);
        });
    } else {
      console.log(`MongoDB uri couldnt be constructed because of missing env variables, cannot connect to database!`);
    }
  }
}
 
export default App;