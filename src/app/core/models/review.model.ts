export interface Review {
  id: string;
  userId: string;
  itemId: string;
  orderId: string;
  rating: number;
  comment: string;
  additionalImages?: { no: number; image: string }[];
  createdAt: string;
}

export interface ReviewDto {
  id: string;
  userId: string;
  itemId: string;
  orderId: string;
  rating: number;
  comment: string;
  additionalImages?: { no: number; image: string }[];
  createdAt: string;
}
