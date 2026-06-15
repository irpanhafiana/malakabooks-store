export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  district?: string;
  subDistrict?: string;
  postalCode: string;
  isDefault: boolean;
}
