export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  alias?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarehousePayload {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}
