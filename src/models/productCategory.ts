import mongoose, { Schema, Document} from 'mongoose';

export enum ProductCategories {
  CAT = 1,
  DOG = 2,
  OTHER = 3
}

export interface IProductCategory extends Document {
  id: number,
  name: string;
  description: string;
}


const productCategorySchema = new Schema<IProductCategory>({
  id: {
    type: Number,
    required: true,
    unique: true
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
  { id: ProductCategories.CAT, name: 'Kitty', description: 'Cat dedicated stuff'},
  { id: ProductCategories.DOG, name: 'Dog', description: 'Dog dedicated stuff'},
  { id: ProductCategories.OTHER, name: 'Other', description: 'Other animal dedicated stuff'},
];

export async function getProductCategoryById(id: ProductCategories): Promise<IProductCategory | null> {
  console.log("WHATTHEFUCK")
  const category = await ProductCategory.findOne({ id: id});
  return category;
}

// insert the categories constant into the ProductCategory collection, avoiding duplicates
Promise.all(PRODUCT_CATEGORIES.map((category) => {
  return ProductCategory.findOneAndUpdate({ id: category.id }, category, { upsert: true });
}))
  .then(() => console.log('Categories inserted or updated successfully'))
  .catch((error) => console.error(error));

export default ProductCategory

