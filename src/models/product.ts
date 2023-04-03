import mongoose, { Schema, Document} from 'mongoose';
import { IUserDocument } from './user'

export interface ProductModel {
  title: string;
  price: number;
  description: string;
}
export interface IProduct extends ProductModel, Document {
  imageUrl: string;
  userId: IUserDocument['_id'];
}

const productSchema = new Schema<IProduct>({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

export default mongoose.model<IProduct>('Product', productSchema);
