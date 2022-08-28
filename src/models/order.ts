import mongoose, { Schema, Document} from 'mongoose';
import { IProduct } from './product'
import { IUserDocument } from './user'

export interface IOrder extends Document {
  products: {
    product: IProduct['_id']
    quantity: number
  }[];
  user: {
    email: string
    userId: IUserDocument['_id']
  };
}

const orderSchema = new Schema<IOrder>({
  products: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: { type: Number, required: true }
    }
  ],
  user: {
    email: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  }
});

export default mongoose.model<IOrder>('Order', orderSchema);