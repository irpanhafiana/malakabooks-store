export interface Review {
  id: string;
  userId: string;
  bookId: string;
  orderId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}
