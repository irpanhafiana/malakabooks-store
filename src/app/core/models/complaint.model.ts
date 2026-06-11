import { ComplaintStatus } from './complaint-status.model';

export interface Complaint {
  id: string;
  userId: string;
  orderId: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  adminResponse: string;
  createdAt: string;
  updatedAt: string;
}
