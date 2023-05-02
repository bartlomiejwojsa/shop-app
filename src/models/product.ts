import mongoose, { Schema, Document} from 'mongoose';
import { IUserDocument } from './user'
import { IProductCategory } from './productCategory';


export interface ProductModel {
  title: string;
  price: number;
  description: string;}

export interface IProduct extends ProductModel, Document {
  imageUrl: string;
  userId: IUserDocument['_id'];
  category: IProductCategory['_id'];
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
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'ProductCategory'
  }
});

export default mongoose.model<IProduct>('Product', productSchema);
