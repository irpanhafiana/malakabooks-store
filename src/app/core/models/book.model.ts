export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  categoryId: string;
  price: number;
  description: string;
  coverImage: string;
  publisher: string;
  publishedYear: number;
  pages: number;
  weight: number; // gram, untuk ongkir
  stock: number;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
}
