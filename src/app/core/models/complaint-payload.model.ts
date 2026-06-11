import { ComplaintStatus } from './complaint-status.model';

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
