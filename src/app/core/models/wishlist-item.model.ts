import { Product } from './product.model';

export interface WishlistItem {
  product: Product;
  addedAt: string;
}
