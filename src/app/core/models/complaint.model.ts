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

export interface CreateComplaintPayload {
  userId: string;
  orderId: string;
  subject: string;
  description: string;
}

export interface RespondComplaintPayload {
  status: ComplaintStatus;
  adminResponse: string;
}
