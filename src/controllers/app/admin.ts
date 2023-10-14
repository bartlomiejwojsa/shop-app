import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import multer from '../../middleware/multer'
import { deleteFile } from '../../util/file';
import { body } from 'express-validator'

import { validationResult } from 'express-validator';

import isAuth from '../../middleware/is-auth';
import Product, { ProductModel } from '../../models/product';

import csrf from 'csurf'
import ProductCategory, { PRODUCT_CATEGORIES } from '../../models/productCategory';

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
    const productCategories = PRODUCT_CATEGORIES
    res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: false,
      errorMessage: null,
      validationErrors: [],
      productCategories
    });
  };

  postAddProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      res.locals.csrfToken = req.csrfToken()

      const productModel: ProductModel = req.body;
      const image = req.file;
      if (!image) {
        const productCategories = PRODUCT_CATEGORIES
        return res.status(422).render('admin/edit-product', {
          pageTitle: 'Add Product',
          path: '/admin/add-product',
          editing: false,
          hasError: true,
          product: productModel,
          errorMessage: 'Attached file is not an image.',
          validationErrors: [],
          productCategories
        });
      }
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        const productCategories = PRODUCT_CATEGORIES
        return res.status(422).render('admin/edit-product', {
          pageTitle: 'Add Product',
          path: '/admin/add-product',
          editing: false,
          hasError: true,
          product: productModel,
          errorMessage: errors.array()[0].msg,
          validationErrors: errors.array(),
          productCategories
        });
      }
  
      const imageUrl = image.path;
      const prodCategory = await ProductCategory.findOne({ id: req.body.category })
      const product = new Product({
        ...productModel,
        imageUrl: imageUrl,
        userId: req.user,
        category: prodCategory
      });
      product
        .save()
        // eslint-disable-next-line no-unused-vars
        .then((_) => {
          res.redirect('/admin/products');
        })
        .catch((err) => {
          const error = new Error(err);
          return next(error);
        });
    } catch (err) {
      const error = new Error(`Ocurred error while adding product: ${String(err)}`);
      return next(error);
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
          pageTitle: 'My Products',
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
        const productCategories = PRODUCT_CATEGORIES
        res.render('admin/edit-product', {
          pageTitle: 'Edit Product',
          path: '/admin/edit-product',
          editing: editMode,
          product: product,
          hasError: false,
          errorMessage: null,
          validationErrors: [],
          productCategories
        });
      })
      .catch(err => {
        const error = new Error(err);
        return next(error);
      });
  };
  
  postEditProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;
    const updatedCategory= await ProductCategory.findOne({ id: req.body.category })


    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const productCategories = PRODUCT_CATEGORIES
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
        validationErrors: errors.array(),
        productCategories
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
        product.category = updatedCategory;
        if (image) {
          deleteFile(product.imageUrl);
          product.imageUrl = image.path;
        }
        return product.save().then(_ => {
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
  ): void => {
    const prodId = req.params.productId;
    Product.findByIdAndDelete(prodId)
      .then( result => {
        console.log("deleted",result)
        res.status(200).json({ message: 'Success!' });
      })
      .catch(_err => {
        res.status(500).json({ message: 'Deleting product failed.' });
      }); 
  };
}

export default AdminController;
