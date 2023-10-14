import { Schema, Document, model } from 'mongoose';
import { IProduct } from './product';

interface IUser extends Document {
  nick: string;
  email: string;
  password: string;
  imageUrl: string;
  token: string;
  resetToken: string | undefined;
  resetTokenExpiration: number | undefined;
  cart: {
    items: ProductInCart[];
  };
  coins: number;
}

interface ProductInCart {
  productId: IProduct['_id'];
  quantity: number;
}

// Put all user instance methods in this interface:
export interface IUserDocument extends IUser, Document {
  // eslint-disable-next-line no-unused-vars
  addToCart(arg0: IProduct): Promise<any>;
  // eslint-disable-next-line no-unused-vars
  removeFromCart(arg0: Schema.Types.ObjectId): Promise<any>;
  clearCart(): Promise<any>;
}

// Create a new Model type that knows about IUserMethods...
// type UserModel = Model<IUser, {}, IUserMethods>;

// And a schema that knows about IUserMethods
const schema = new Schema<IUserDocument>({
  nick: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  token: {
    type: String,
    required: true
  },
  coins: {
    type: Number,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Number,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: { type: Number, required: true }
      }
    ]
  }
});

schema.methods.addToCart = function (product: IProduct): Promise<any> {
  const cartProductIndex = this.cart.items.findIndex(
    (cp: ProductInCart) => {
      return (
        cp.productId.toString() === product._id.toString()
      );
    }
  );
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity =
      this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity =
      newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity
    });
  }
  const updatedCart = {
    items: updatedCartItems
  };
  this.cart = updatedCart;
  return this.save();
};

schema.methods.removeFromCart = function(
  productId: Schema.Types.ObjectId
): Promise<any> {
  const updatedCartItems = this.cart.items.filter(
    (item: ProductInCart) => {
      return (
        item.productId.toString() !== productId.toString()
      );
    }
  );
  this.cart.items = updatedCartItems;
  return this.save();
};

schema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

export const User = model<IUserDocument>('User', schema);