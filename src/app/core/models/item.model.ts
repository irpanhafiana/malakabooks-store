import { UomGroup } from './uom-group.model';

export interface CatalogItem {
  id: string;
  name: string;
  sapCode: string;
  itemType: string;
  uomGroupId?: string;
  uomGroup?: UomGroup;
  baseUomCode: string;
  description: string;
  isActive: boolean;
  categoryId?: string;
  coverImage?: string;
  additionalImages?: { no: number; image: string }[];
  weight?: number;
  stock?: number;
  bookId?: string;
  isbn?: string;
  authorIds?: string[];
  publisher?: string;
  publishedYear?: number;
  pages?: number;
  price?: number;
  salesUomCode?: string;
  customerGroupCode?: string;
  priceStartDate?: string;
  priceEndDate?: string;
  compareAtPrice?: number;
  compareAtPriceStartDate?: string;
  compareAtPriceEndDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateItemPayload {
  name: string;
  sapCode: string;
  itemType: string;
  uomGroupId?: string;
  baseUomCode: string;
  description: string;
  isActive: boolean;
}
