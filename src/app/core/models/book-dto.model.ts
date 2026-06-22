export interface AdditionalImageDto {
  no: number;
  image: string;
}

export interface BookDto {
  id: string;
  title: string;
  description?: string;
  price: number;
  categoryId: string;
  stock?: number;
  averageRating?: number;
  totalReviews?: number;
  coverImage?: string;
  additionalImages?: AdditionalImageDto[];
  publisher?: string;
  author?: string;
  isbn?: string;
  publishedYear?: number;
  pages?: number;
  weight?: number;
  createdAt?: string;
}
