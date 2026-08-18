import { UomGroup } from './uom-group.model';

export interface AdditionalImage {
  no: number;
  image: string;
}

export interface Product {
  id: string;
  itemId?: string;
  itemType?: 'malaka' | 'mardika';
  title: string;
  sapCode: string;
  baseUomCode?: string;
  uomGroup?: UomGroup;
  authorIds: string[];
  authors: {
    id: string;
    name: string;
    role: string;
    biography: string;
    photoUrl: string;
  }[];
  authorNames: string;
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
  quantitySold?: number;
  rating?: number;
  salesUomCode?: string;
  customerGroupCode?: string;
  priceStartDate?: string;
  priceEndDate?: string;
  compareAtPrice?: number;
  compareAtPriceStartDate?: string;
  compareAtPriceEndDate?: string;
  createdAt: string;
  additionalImages: AdditionalImage[];
}

export type AdditionalImageDto = AdditionalImage;

export interface BookDto {
  id: string;
  itemId?: string;
  itemType?: 'malaka' | 'mardika';
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
