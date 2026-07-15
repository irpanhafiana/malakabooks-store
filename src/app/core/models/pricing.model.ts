export interface PricingDetail {
  customerGroupCode: string;
  uomCode: string;
  price: number;
}

export interface Pricing {
  id: string;
  name: string;
  itemId?: string;
  itemCode?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  details: PricingDetail[];
  createdAt?: string;
  updatedAt?: string;
  alias?: string;
}

export interface CreatePricingPayload {
  name: string;
  itemId?: string;
  itemCode?: string;
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
