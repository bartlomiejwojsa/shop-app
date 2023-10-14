// import fs from 'fs';
import * as express from 'express';
import { Request, Response } from 'express';

import Product from '../../models/product';
import { User } from '../../models/user';
import multer from '../../middleware/multer'
import tokenAuth from '../../middleware/is-tokenAuth'
import ProductCategory from '../../models/productCategory';

// import { IUserDocument } from '../../models/user';


class APIProductsController {
  public path = '/api/products';
  public router = express.Router();

  constructor() {
    this.initializeRouter();
  }

  private initializeRouter = () => {
    this.router.get(
      '/categories',
      tokenAuth,
      this.getProductCategories
    );
    this.router.get(
      '/top-rated',
      tokenAuth,
      this.getTopRatedProducts
    );
    this.router.post(
      '/',
      multer,
      this.addProduct
    )
    this.router.post(
      '/:productId',
      this.updateProduct
    );
  };

  getProductCategories = (
    req: Request,
    res: Response
  ): void => {
    ProductCategory.find()
      .then((productCategories) => {
        console.log(productCategories)
        return res.status(200).end(JSON.stringify({
          success: true,
          message: "Product categories fetched successfuly",
          productCategories: productCategories
        }))
      })
      .catch((_err) => {
        console.log(_err)
        return res.status(500).end(JSON.stringify({
          success: false,
          message: "Internal server error. Contact admin"
        }))
      });
  };

  getTopRatedProducts = (
    req: Request,
    res: Response
  ): void => {
    const limit = req.query.limit ? +req.query.limit : 999

    Product.find().sort({ likes: -1}).limit(limit).populate('category').populate('likedBy')
      .then((products) => {
        var adress = `http://localhost:${process.env.PORT}`
        if (process.env.IS_GLITCH_SERVER === "true") {
          adress = `https://${process.env.PROJECT_DOMAIN}.glitch.me`
        }
        const prods = products.map( product => {
          product.imageUrl = `${adress}/${product.imageUrl}`
          return product
        })
        console.log(prods)
        return res.status(200).end(JSON.stringify({
          success: true,
          message: "Products fetched successfuly",
          products: prods
        }))
      })
      .catch((_err) => {
        return res.status(500).end(JSON.stringify({
          success: false,
          message: "Internal server error. Contact admin"
        }))
      });
  };

  addProduct = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { title, price, description, categoryTag } = req.body;
      const image = req.file;
      if (!image) {
        res.status(500).end(JSON.stringify({
          success: false,
          message: "Internal server error. Contact admin"
        }))
        return
      }
      const imageUrl = image.path;
      console.log(imageUrl)
      const user = await User.findOne()
      const category = await ProductCategory.findOne({ tag: categoryTag })
      const product = new Product({
        title: title,
        price: price,
        category: category,
        description: description,
        imageUrl: imageUrl,
        userId: user
      });
      await product.save()
      res.status(200).end(JSON.stringify({
        success: true,
        message: "Product added successfuly"
      }))
    } catch (err) {
      console.log(err)
      res.status(500).end(JSON.stringify({
        success: false,
        message: "Internal server error. Contact admin"
      }))
    }

  };

  updateProduct = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    
    const prodId = req.params.productId;
    const product = await Product.findById(prodId).populate('likedBy')
    if (!product) {
      res.status(422).end(JSON.stringify({
        success: false,
        message: "Provided product does not exists"
      }))
      return
    }
    // update property one by one
    const likeStatusUpdate = req.body.like
    if (likeStatusUpdate) {
      const likedUserFound = product.likedBy.find(likeUserDetails => {
        likeUserDetails.id.toString() === likeStatusUpdate.userId.toString()
      })
      if (likeStatusUpdate.value > 0 && !likedUserFound) {
        const user = await User.findById(likeStatusUpdate.userId)
        product.likedBy.push(user)
      } else {
        product.likedBy = product.likedBy.filter( likeUserDetails => {
          likeUserDetails.id.toString() !== likeStatusUpdate.userId.toString()
        })
      }
    }
    await product.save()
    res.status(200).end(JSON.stringify({
      success: true,
      message: "Product updated successfuly"
    }))
    return
  };

}

export default APIProductsController;
