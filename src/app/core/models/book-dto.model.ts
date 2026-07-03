export interface AdditionalImageDto {
  no: number;
  image: string;
}

export interface BookDto {
  id: string;
  title: string;
  sapCode?: string;
  authorIds: string[];
  authors: {
    id: string;
    name: string;
    role?: string;
    biography?: string;
    photoUrl?: string;
  }[];
  isbn?: string;
  categoryId: string;
  price: number;
  description?: string;
  coverImage?: string;
  publisher?: string;
  publishedYear?: number;
  pages?: number;
  weight?: number;
  stock?: number;
  averageRating?: number;
  totalReviews?: number;
  createdAt?: string;
  additionalImages?: AdditionalImageDto[];
}
