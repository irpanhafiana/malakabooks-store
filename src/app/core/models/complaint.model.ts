export interface Complaint {
  id: string;
  userId: string;
  orderId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminResponse: string;
  createdAt: string;
  updatedAt: string;
}
