import { Request, Response, NextFunction } from 'express';
import { User, IUserDocument } from '../models/user';
import jwt from 'jsonwebtoken';

// declare module 'express-session' {
//   // eslint-disable-next-line no-unused-vars
//   interface SessionData {
//     user?: IUserDocument;
//   }
// }

declare module 'express' {
  // eslint-disable-next-line no-unused-vars
  interface Request {
    user?: IUserDocument;
  }
}

export default (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).end(JSON.stringify({
    success: false,
    message: "Unauthorized"
  }))
  jwt.verify(token, process.env.JWT_SECRET_KEY!, (err, _) => {
    if (err) return res.status(401).end(JSON.stringify({
      success: false,
      message: "Unauthorized"
    }))
    User.findOne({ token: token })
      .then((user) => {
        if (!user) {
          return res.status(401).json({ error: "Unauthorized" })
        }
        req.user = user;
        next();
      })
      .catch((err) => {
        console.log(err)
        return res.status(500).end(JSON.stringify({
          success: false,
          message: "Internal server error. Contact admin"
        }))
      })
  });
}