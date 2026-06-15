export interface HomeAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  province: string;
  city: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  longitude?: number;
  latitude?: number;
}
