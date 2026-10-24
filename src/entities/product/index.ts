export {
  fetchCatalog,
  fetchCategories,
  fetchProductBySlug,
  fetchProductImages,
  fetchProducts,
  toProduct,
} from './api';
export type { ProdutoResponse } from './api';
export { ProductCard } from './ProductCard';
export { ProductImage } from './ProductImage';
export { PRODUCT_IMAGE_PLACEHOLDER, STORE_PRESENTATION } from './types';
export type { Category, Product, StoreLink, StoreSlug } from './types';
