import mongoose, { Schema, Document} from 'mongoose';
import { IUserDocument } from './user'
import { IProductCategory } from './productCategory';


export interface ProductModel {
  title: string;
  price: number;
  description: string;
}

export interface IProduct extends ProductModel, Document {
  imageUrl: string;
  userId: IUserDocument['_id'];
  category: IProductCategory['_id'];
  likedBy: IUserDocument['_id'][];
  likes: number;
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
  },
  likedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  ],
}, {
  toJSON: { virtuals: true }, // enable virtual fields to be included in JSON output
  toObject: { virtuals: true }, // enable virtual fields to be included in plain JavaScript objects
});

productSchema.virtual('likes').get(function() {
  return this.likedBy.length
})

export default mongoose.model<IProduct>('Product', productSchema);
