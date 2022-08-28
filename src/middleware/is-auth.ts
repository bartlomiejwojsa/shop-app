import { Request, Response, NextFunction } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  let isLoggedIn = req.session?.isLoggedIn ?? false;
  if (!isLoggedIn) {
      return res.redirect('/login');
  }
  next();
}