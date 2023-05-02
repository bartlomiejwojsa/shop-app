import { Request, Response, NextFunction } from 'express';
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

export default (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  const apiKey = req.query.apiKey ?? '';
  User.findOne({ apiKey: apiKey })
    .then((user) => {
      if (!user || apiKey !== req.session.user?.apiKey) {
        return res.status(401).json({ error: "Unauthorized" })
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      const error = new Error(err)
      // error.httpStatusCode = 500;
      return next(error)
    })
}