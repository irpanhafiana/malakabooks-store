export interface WarehouseStock {
  id: string;
  baseUomCode: string;
  warehouseId: string;
  itemId: string;
  quantityOnHand: number;
  reservedQuantity: number;
  updatedAt?: string;
  alias?: string;
}

export interface CreateWarehouseStockPayload {
  baseUomCode: string;
  warehouseId: string;
  itemId: string;
  quantityOnHand: number;
  reservedQuantity: number;
}
