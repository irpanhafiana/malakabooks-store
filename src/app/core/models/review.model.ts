export interface Review {
  id: string;
  userId: string;
  bookId: string;
  orderId: string;
  rating: number;
  comment: string;
  additionalImages?: { image: string }[];
  createdAt: string;
}
