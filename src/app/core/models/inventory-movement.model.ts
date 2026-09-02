export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  movementType: string;
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  referenceId: string;
  note: string;
  createdAt: string;
}
