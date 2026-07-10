export interface InventoryMovement {
  id: string;
  bookId: string;
  bookTitle: string;
  movementType: string;
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  referenceId: string;
  note: string;
  createdAt: string;
}
