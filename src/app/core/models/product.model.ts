export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  categoryName: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  featured: boolean;
  brand: string;
  authorId: string;
  authorName?: string;
  specifications: Record<string, string>;
  createdAt: string;
}
