export interface PaymentFee {
  code: string;
  name: string;
  type: string;
  value: number;
}

export interface Payment {
  id: string;
  name: string;
  methodType: string;
  alias: string;
  fees: PaymentFee[];
}

export interface CreatePaymentPayload {
  name: string;
  methodType: string;
  fees: PaymentFee[];
}

export interface UpdatePaymentPayload extends CreatePaymentPayload {}
