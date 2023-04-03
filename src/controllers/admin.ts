import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import multer from '../middleware/multer'
import { deleteFile } from '../util/file';
import { body } from 'express-validator'

import { validationResult } from 'express-validator';

import isAuth from '../middleware/is-auth';
import Product, { ProductModel } from '../models/product';

import csrf from 'csurf'

const csrfProtection = csrf( { cookie: true })

class AdminController {
  public path = '/admin';
  public router = express.Router();

  constructor() {
    this.initializeRouter();
  }

  private initializeRouter = () => {
    this.router.get(
      '/add-product',
      csrfProtection,
      isAuth,
      this.getAddProduct
    );
    this.router.post(
      '/add-product',
      multer,
      [
        body('title')
          .isString()
          .isLength({ min: 3 })
          .trim(),
        body('price').isFloat(),
        body('description')
          .isLength({ min: 5, max: 400 })
          .trim()
      ],
      csrfProtection,
      isAuth,
      this.postAddProduct
    );
    this.router.get(
      '/products',
      csrfProtection,
      isAuth,
      this.getProducts
    );
    this.router.get(
      '/edit-product/:productId',
      csrfProtection,
      isAuth,
      this.getEditProduct
    );
    this.router.post(
      '/edit-product',
      multer,
      [
        body('title')
          .isString()
          .isLength({ min: 3 })
          .trim(),
        body('price').isFloat(),
        body('description')
          .isLength({ min: 5, max: 400 })
          .trim()
      ],
      csrfProtection,
      isAuth,
      this.postEditProduct
    );
    this.router.delete(
      '/product/:productId',
      csrfProtection,
      isAuth,
      this.deleteProduct
    );
  };


  getAddProduct = (req: Request, res: Response): void => {
    res.locals.csrfToken = req.csrfToken()
    res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    });
  };

  postAddProduct = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      console.log("postAddProduct")
      res.locals.csrfToken = req.csrfToken()

      const productModel: ProductModel = req.body;
      const image = req.file;
      if (!image) {
        return res.status(422).render('admin/edit-product', {
          pageTitle: 'Add Product',
          path: '/admin/add-product',
          editing: false,
          hasError: true,
          product: productModel,
          errorMessage: 'Attached file is not an image.',
          validationErrors: []
        });
      }
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
          pageTitle: 'Add Product',
          path: '/admin/add-product',
          editing: false,
          hasError: true,
          product: productModel,
          errorMessage: errors.array()[0].msg,
          validationErrors: errors.array()
        });
      }
  
      const imageUrl = image.path;
  
      const product = new Product({
        ...productModel,
        imageUrl: imageUrl,
        userId: req.user
      });
      product
        .save()
        // eslint-disable-next-line no-unused-vars
        .then((_) => {
          res.redirect('/admin/products');
        })
        .catch((err) => {
          const error = new Error(err);
          console.log(error)
          return next(error);
        });
    } catch (err) {
      console.log('ERRR',err);
    }
  };

  getProducts = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    res.locals.csrfToken = req.csrfToken()
    Product.find({ userId: req.user?._id })
      .then(products => {
        res.render('admin/products', {
          prods: products,
          pageTitle: 'Admin Products',
          path: '/admin/products'
        });
      })
      .catch(err => {
        const error = new Error(err);
        return next(error);
      });
  };


  getEditProduct = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    res.locals.csrfToken = req.csrfToken()

    const editMode = req.query.edit;
    if (!editMode) {
      return res.redirect('/');
    }
    const prodId = req.params.productId;

    Product.findById(prodId)
      .then(product => {
        if (!product) {
          return res.redirect('/');
        }
        res.render('admin/edit-product', {
          pageTitle: 'Edit Product',
          path: '/admin/edit-product',
          editing: editMode,
          product: product,
          hasError: false,
          errorMessage: null,
          validationErrors: []
        });
      })
      .catch(err => {
        const error = new Error(err);
        return next(error);
      });
  };
  
  postEditProduct = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: true,
        hasError: true,
        product: {
          title: updatedTitle,
          price: updatedPrice,
          description: updatedDesc,
          _id: prodId
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array()
      });
    }

    Product.findById(prodId)
      .then(product => {
        if (!product) {
          return res.redirect('/');
        }
        if (product.userId.toString() !== req.user?._id.toString()) {
          return res.redirect('/');
        }
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDesc;
        if (image) {
          deleteFile(product.imageUrl);
          product.imageUrl = image.path;
        }
        return product.save().then(_ => {
          console.log('UPDATED PRODUCT!');
          res.redirect('/admin/products');
        });
      })
      .catch(err => {
        const error = new Error(err);
        return next(error);
      });
  };


  deleteProduct = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const prodId = req.params.productId;
    Product.findById(prodId)
      .then(product => {
        if (!product) {
          return next(new Error('Product not found.'));
        }
        deleteFile(product.imageUrl);
        return product.deleteOne();
      })
      .then(() => {
        console.log('DESTROYED PRODUCT');
        res.status(200).json({ message: 'Success!' });
      })
      .catch(_err => {
        res.status(500).json({ message: 'Deleting product failed.' });
      });
  };

}

export default AdminController;
