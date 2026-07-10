export interface PricingDetail {
  itemId: string;
  uomCode: string;
  price: number;
}

export interface Pricing {
  id: string;
  code: string;
  name: string;
  customerGroupCode: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  details: PricingDetail[];
  createdAt?: string;
  updatedAt?: string;
  alias?: string;
}

export interface CreatePricingPayload {
  code: string;
  name: string;
  customerGroupCode: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  details: PricingDetail[];
}

export interface PriceLookupResponse {
  itemId: string;
  uomCode: string;
  customerGroupCode: string;
  price: number;
  startDate: string;
  endDate: string;
}
