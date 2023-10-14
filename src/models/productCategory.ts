import mongoose, { Schema, Document} from 'mongoose';

export interface IProductCategory extends Document {
  id: number,
  tag: string,
  name: string;
  description: string;
}


const productCategorySchema = new Schema<IProductCategory>({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  tag: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
}, { id: true });

const ProductCategory = mongoose.model<IProductCategory>('ProductCategory', productCategorySchema);

// define the categories constant
export const PRODUCT_CATEGORIES = [
  { id: 1, tag: "CAT", name: 'Cat', description: 'Cat dedicated stuff'},
  { id: 2, tag: "DOG", name: 'Dog', description: 'Dog dedicated stuff'},
  { id: 3, tag: "OTHER", name: 'Other', description: 'Other animal dedicated stuff'},
];

// insert the categories constant into the ProductCategory collection, avoiding duplicates
Promise.all(PRODUCT_CATEGORIES.map((category) => {
  return ProductCategory.findOneAndUpdate({ id: category.id }, category, { upsert: true });
}))
  .then(() => console.log('Categories inserted or updated successfully'))
  .catch((error) => console.error(error));

export default ProductCategory

