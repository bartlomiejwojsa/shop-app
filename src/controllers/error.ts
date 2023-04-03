import * as express from 'express'
import { Request, Response } from 'express'
import session from 'express-session';

interface Err404PageOptions {
  pageTitle: string;
  path: string;
  isAuthenticated: session.SessionData["isLoggedIn"]
}

interface Err500PageOptions {
  pageTitle: string;
  path: string;
  isAuthenticated: session.SessionData["isLoggedIn"]
}

class ErrorController {
  public path = '/'
  public router = express.Router();

  constructor() {
    this.initializeRouter();
  }

  private initializeRouter = () => {
    this.router.get('/404', this.get404);
    this.router.get('/500', this.get500);
  }

  get404 = (req: Request, res: Response): void => {
    const viewOptions: Err404PageOptions = {
      pageTitle: 'Page Not Found',
      path: '/404',
      isAuthenticated: req.session?.isLoggedIn ?? false,
    }
    return res.status(404).render('404', viewOptions)
  }
  get500 = (req: Request, res: Response) => {
    const viewOptions: Err500PageOptions = {
      pageTitle: 'Server error! Please, contact with administrator',
      path: '/500',
      isAuthenticated: req.session?.isLoggedIn ?? false,
    }
    return res.status(500).render('500', viewOptions)
  }
}



export default ErrorController;