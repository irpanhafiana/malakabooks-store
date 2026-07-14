import { ComplaintStatus } from './complaint-status.model';

export interface ComplaintMessage {
  senderType: string;
  senderId: string;
  message: string;
  additionalImages?: { no: number; image: string; }[];
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  orderId: string;
  itemId?: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  additionalImages?: { no: number; image: string; }[];
  messages: ComplaintMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintPayload {
  userId: string;
  orderId: string;
  itemId: string;
  subject: string;
  description: string;
  additionalImages?: { no: number; image: string; }[];
}

export interface RespondComplaintPayload {
  status: ComplaintStatus;
  message: string;
  senderId: string;
  senderType: string;
  additionalImages?: { no: number; image: string; }[];
}

export interface ReplyComplaintPayload {
  status: string;
  message: string;
  senderId: string;
  senderType: string;
  additionalImages?: { no: number; image: string; }[];
}
