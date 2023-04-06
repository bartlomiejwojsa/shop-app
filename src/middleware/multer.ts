import { Express, NextFunction, Request, Response } from 'express';

import multer, { FileFilterCallback } from 'multer';

// eslint-disable-next-line no-unused-vars
type DestinationCallback = (error: Error | null, destination: string) => void
// eslint-disable-next-line no-unused-vars
type FileNameCallback = (error: Error | null, filename: string) => void

const fileStorage = multer.diskStorage({
  destination: (
    _request: Request,
    _file: Express.Multer.File,
    cb: DestinationCallback
  ) => {
    cb(null, 'images');
  },
  filename: (
    _req: Request, 
    file: Express.Multer.File, 
    cb: FileNameCallback
  ) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (
  _request: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: fileStorage, fileFilter: fileFilter });

export default (req: Request, res: Response, next: NextFunction) => {
  return upload.single('image')(req, res, () => {
    if (!req.file) {
      return res.status(500).json({ error: 'Occured problem while uploading photo!'})
    }
    next();
  });
}
