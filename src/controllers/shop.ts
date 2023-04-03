// import fs from 'fs';
import * as express from 'express';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Request, Response, NextFunction } from 'express';

import Product from '../models/product';
import Order from '../models/order';

import isAuth from '../middleware/is-auth';
import { IUserDocument } from '../models/user';
import csrf from 'csurf'

const csrfProtection = csrf( { cookie: true })

const ITEMS_PER_PAGE = 4;

class ShopController {
  public path = '/';
  public router = express.Router();

  constructor() {
    this.initializeRouter();
  }

  private initializeRouter = () => {
    this.router.get(
      '/',
      csrfProtection,
      this.getIndex
    );
    this.router.get(
      '/products',
      csrfProtection,
      this.getProducts
    );
    this.router.get(
      '/products/:productId',
      csrfProtection,
      this.getProduct
    );
    this.router.get(
      '/cart',
      csrfProtection,
      isAuth,
      this.getCart
    );
    this.router.post(
      '/cart',
      csrfProtection,
      isAuth,
      this.postCart
    );
    this.router.post(
      '/cart-delete-item',
      csrfProtection,
      isAuth,
      this.postCartDeleteProduct
    );
    this.router.get(
      '/checkout',
      csrfProtection,
      isAuth,
      this.getCheckout
    );
    this.router.post(
      '/create-order',
      csrfProtection,
      isAuth,
      this.postOrder
    );
    this.router.get(
      '/orders',
      isAuth,
      this.getOrders
    );
    this.router.get(
      '/orders/:orderId',
      isAuth,
      this.getInvoice
    );
  };

  getProducts = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    res.locals.csrfToken = req.csrfToken()

    const page = +(req.query?.page ?? 1);
    let totalItems: number;

    Product.find()
      .countDocuments()
      .then((numProducts: number) => {
        totalItems = numProducts;
        return Product.find()
          .skip((page - 1) * ITEMS_PER_PAGE)
          .limit(ITEMS_PER_PAGE);
      })
      .then((products) => {
        res.render('shop/product-list', {
          prods: products,
          pageTitle: 'Products',
          path: '/products',
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.message = 'Error 500';
        return next(error);
      });
  };

  getIndex = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    res.locals.csrfToken = req.csrfToken()
    const page = +(req.query?.page ?? 1);
    let totalItems: number;
    Product.find()
      .countDocuments()
      .then((numProducts: number) => {
        totalItems = numProducts;
        return Product.find()
          .skip((page - 1) * ITEMS_PER_PAGE)
          .limit(ITEMS_PER_PAGE);
      })
      .then((products) => {
        res.render('shop/index', {
          prods: products,
          pageTitle: 'Shop',
          path: '/',
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.message = 'Error 500';
        return next(error);
      });
  };

  getProduct = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    res.locals.csrfToken = req.csrfToken()

    const productId = req.params.productId ?? '';

    Product.findById(productId)
      .then((product) => {
        res.render('shop/product-detail', {
          product: product,
          pageTitle: product!.title,
          path: '/products'
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.message = 'Error 500';
        return next(error);
      });
  };

  getCart = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    res.locals.csrfToken = req.csrfToken()
    const myUser: IUserDocument = req.user!
    myUser.populate('cart.items.productId')
      .then((user) => {
        const products = user.cart.items;
        res.render('shop/cart', {
          path: '/cart',
          pageTitle: 'Your Cart',
          products: products
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.message = 'Error 500';
        return next(error);
      });
  };

  postCart = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const prodId = req.body.productId;
    const myUser: IUserDocument = req.user!
    Product.findById(prodId)
      .then((product) => {
        if (product) {
          return myUser.addToCart(product);
        }
        throw new Error('invalid product');
      })
      .then((_) => {
        res.redirect('/cart');
      })
      .catch((err) => {
        const error = new Error(err);
        return next(error);
      });
  };

  postCartDeleteProduct = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const prodId = req.body.productId;
    const myUser: IUserDocument = req.user!;
    myUser
      .removeFromCart(prodId)
      // eslint-disable-next-line no-unused-vars
      .then(_result => {
        res.redirect('/cart');
      })
      .catch(err => {
        const error = new Error(err);
        return next(error);
      });
  };

  getCheckout = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    res.locals.csrfToken = req.csrfToken()
    const myUser: IUserDocument = req.user!;
    myUser
      .populate('cart.items.productId')
      .then(user => {
        const products = user.cart.items;
        let total = 0;
        products.forEach(p => {
          total += p.quantity * p.productId?.price;
        });
        res.render('shop/checkout', {
          path: '/checkout',
          pageTitle: 'Checkout',
          products: products,
          totalSum: total
        });
      })
      .catch(err => {
        const error = new Error(err);
        return next(error);
      });
  };
  
  postOrder = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const myUser: IUserDocument = req.user!
    myUser.populate('cart.items.productId')
      .then(user => {
        const products = user.cart.items.map(i => {
          return { quantity: i.quantity, product: { ...i.productId } };
        });
        const order = new Order({
          user: {
            email: user.email,
            userId: user
          },
          products: products
        });
        return order.save();
      })
      // eslint-disable-next-line no-unused-vars
      .then(_result => {
        return myUser.clearCart();
      })
      .then(() => {
        res.redirect('/orders');
      })
      .catch(err => {
        const error = new Error(err);
        return next(error);
      });
  };

  getOrders = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const myUser: IUserDocument = req.user!;
    Order.find({ 'user.userId': myUser._id })
      .populate('products.product')
      .then(orders => {
        res.render('shop/orders', {
          path: '/orders',
          pageTitle: 'Your Orders',
          orders: orders
        });
      })
      .catch(err => {
        const error = new Error(err);
        return next(error);
      });
  };

  getInvoice = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const myUser: IUserDocument = req.user!;
    const orderId = req.params.orderId;
    Order.findById(orderId)
      .populate('products.product')
      .then(order => {
        if (!order) {
          return next(new Error('No order found.'));
        }
        if (order.user.userId.toString() !== myUser._id.toString()) {
          return next(new Error('Unauthorized'));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);
  
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'inline; filename="' + invoiceName + '"'
        );
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
  
        pdfDoc.fontSize(26).text('Invoice', {
          underline: true
        });
        pdfDoc.text('-----------------------');
        let totalPrice = 0;
        order.products.forEach(prod => {
          totalPrice += prod.quantity * (prod.product?.price ?? 0);
          pdfDoc
            .fontSize(14)
            .text(
              (prod.product?.title ?? "unknown") +
                ' - ' +
                prod.quantity +
                ' x ' +
                '$' +
                (prod.product?.price ?? 0)
            );
        });
        pdfDoc.text('---');
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
        console.log('Total Price: $' + totalPrice)
        pdfDoc.end();
      })
      .catch(err => {
        console.log(err)
        next(err)
      });
  };
}

export default ShopController;
