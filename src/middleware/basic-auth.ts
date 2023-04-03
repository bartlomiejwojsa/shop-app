import { Request, Response, NextFunction } from 'express'
import { User, IUserDocument } from '../models/user';

declare module 'express-session' {
  // eslint-disable-next-line no-unused-vars
  interface SessionData {
    user?: IUserDocument;
  }
}

declare module 'express' {
  // eslint-disable-next-line no-unused-vars
  interface Request {
    user?: IUserDocument;
  }
}

export default (req: Request, _res: Response, next: NextFunction) => {
  console.log(req.body)
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
}