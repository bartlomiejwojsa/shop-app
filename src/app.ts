import express, { Application } from 'express';
import mongoose from 'mongoose';


declare module 'express-session' {
  // eslint-disable-next-line no-unused-vars
  interface SessionData {
    isLoggedIn?: boolean | undefined;
  }
}

class App {
  public app: Application
  public port: number

  constructor(middleWares: any, controllers: any) {
    this.app = express()
    this.port = +(process.env.PORT ?? 3000);

    this.assets();
    this.template();
    this.middlewares(middleWares);
    this.routes(controllers);
    this.unknown();
  }

  // eslint-disable-next-line no-unused-vars
  private middlewares(middleWares: { forEach: (arg0: (middleWare: any) => void) => void; }) {
      middleWares.forEach(middleWare => {
        this.app.use(middleWare);
      })
  }

  // eslint-disable-next-line no-unused-vars
  private routes(controllers: { forEach: (arg0: (controller: any) => void) => void; }) {
      controllers.forEach(controller => {
        this.app.use(controller.path, controller.router)
      });
  }

  private assets() {
    this.app.use(express.static('public'));
    this.app.use(express.static('views'));
    this.app.use('/images', express.static('images'));
  }

  private template() {
    this.app.set('view engine', 'ejs');
    this.app.set('views', 'views');
  }
  
  private unknown() {
    // eslint-disable-next-line no-unused-vars
    this.app.use((_error: any, req: any, res: any, _next: any) => {
      // res.status(error.httpStatusCode).render(...);
      // res.redirect('/500');
      let isLoggedIn = req.session?.isLoggedIn ?? false;
      res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: isLoggedIn,
      });
    });
  }

  public listen() {
    if (process.env.MONGODB_URI) {
      try {
        mongoose
          // eslint-disable-next-line no-unused-vars
          .connect(process.env.MONGODB_URI, {}, (_result) => {
            this.app.listen(this.port, () => {
              console.log(`App listening on the http://localhost:${this.port}`);
            });
          })
      } catch (err) {
        console.log(err);
      }
    } else {
      throw new Error(
        `'MONGODB_URI' ${process.env.MONGODB_URI} is not defined, cannot connect to database!`
      );
    }
  }
}
 
export default App;