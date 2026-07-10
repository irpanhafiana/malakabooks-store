export interface CatalogItem {
  id: string;
  name: string;
  sapCode: string;
  itemType: string;
  uomGroupId?: string;
  baseUomCode: string;
  description: string;
  isActive: boolean;
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
