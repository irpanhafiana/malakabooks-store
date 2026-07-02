export interface AdditionalImage {
  no: number;
  image: string;
}

export interface Product {
  id: string;
  title: string;
  sapCode: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    role: string;
    biography: string;
    photoUrl: string;
  } | null;
  isbn: string;
  categoryId: string;
  price: number;
  description: string;
  coverImage: string;
  publisher: string;
  publishedYear: number;
  pages: number;
  weight: number;
  stock: number;
  categoryName?: string;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  additionalImages: AdditionalImage[];
}
