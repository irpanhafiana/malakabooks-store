export interface InventoryMovement {
  id: string;
  itemId: string;
  itemTitle: string;
  movementType: string;
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  referenceId: string;
  note: string;
  createdAt: string;
}
