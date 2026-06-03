export interface Address {
  id: string;
  userId: string;
  label: string; // "Rumah", "Kantor", dll
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}
