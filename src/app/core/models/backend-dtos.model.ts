/**
 * DTO respons backend yang mencerminkan `MalakaBooks.ViewModel` (serialisasi Newtonsoft
 * camelCase, null di-drop). Dipakai untuk mentipekan panggilan HTTP di boundary agar
 * pemetaan `dto -> domain` diperiksa compiler, menggantikan `http.get<any>`.
 *
 * Catatan: field dibuat optional bila backend bisa menghilangkannya (NullValueHandling.Ignore)
 * atau bila casing dari sistem eksternal (Simasrim) tidak konsisten.
 */

/** Cerminan `AddressResponse` (: HomeAddressResponse + UserId, IsDefault). */
export interface AddressResponseDto {
  id: string;
  label: string;
  addressCode?: string;
  recipientName: string;
  phone: string;
  street: string;
  province: string;
  city: string;
  district?: string;
  subDistrict?: string;
  postalCode: string;
  longitude?: number;
  latitude?: number;
  userId: string;
  isDefault: boolean;
}

/**
 * Cerminan `UserResponse` (id, firstName, lastName, phone, avatar, createdAt).
 * `role`/`email` TIDAK ada di kontrak `UserResponse` backend saat ini — dibiarkan optional
 * agar pemetaan yang membacanya jujur bahwa nilainya mungkin undefined.
 */
export interface UserResponseDto {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  role?: string;
  email?: string;
}

/** Item dalam `OrderResponse.Items` (`OrderItemResponse`), dengan toleransi field lama. */
export interface OrderItemResponseDto {
  itemId?: string;
  bookId?: string;
  id?: string;
  itemName?: string;
  title: string;
  uomCode?: string;
  price: number;
  coverImage?: string;
  quantity: number;
}

/** `OrderUserResponse` yang tertanam pada `OrderResponse.User`. */
export interface OrderUserResponseDto {
  userId?: string;
  customerGroupCode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/** Cerminan `OrderResponse`/`AdminOrderResponse`. Beberapa varian casing AWB ditoleransi. */
export interface OrderResponseDto {
  id: string;
  userId: string;
  user?: OrderUserResponseDto;
  items: OrderItemResponseDto[];
  addressId: string;
  status: string;
  paymentStatus?: string;
  paymentId?: string;
  paymentMethod?: string;
  paymentGateway?: string;
  paymentUrl?: string;
  itemsSubtotal?: number;
  grandTotal?: number;
  totalPrice?: number;
  shippingFee?: number;
  shippingInsurance?: number;
  note?: string;
  shippingCourier?: string;
  shippingType?: string;
  shippingEst?: string;
  createdAt: string;
  updatedAt?: string;
  // Casing tidak konsisten dari backend/Simasrim — toleransi beberapa varian.
  awbNo?: string;
  aWBNo?: string;
  AWBNo?: string;
  trackingNumber?: string;
  ShippingCourier?: string;
}

/** Cerminan `CreateOrderResponse`. */
export interface CreateOrderResponseDto {
  isSuccess: boolean;
  message: string;
  errors?: Record<string, string>;
  orderId: string;
  paymentUrl: string;
}

/** Cerminan `PagedResult<T>` dari Subur.Extension (dipakai pada admin Orders list). */
export interface PagedResultDto<T> {
  results: T[];
  rowCount: number;
  currentPage: number;
  pageSize: number;
}

/** Cerminan `ComplaintResponse`. */
export interface ComplaintResponseDto {
  id: string;
  userId: string;
  orderId: string;
  itemId?: string;
  subject: string;
  description: string;
  status: string;
  additionalImages?: { no: number; image: string }[];
  messages?: { senderType: string; senderId: string; message: string; additionalImages?: { no: number; image: string }[]; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

/** Cerminan data cart item di backend. */
export interface CartItemResponseDto {
  itemId: string;
  uomCode?: string;
  quantity: number;
}

/** Cerminan data cart di backend. */
export interface CartDataResponseDto {
  items: CartItemResponseDto[];
}

