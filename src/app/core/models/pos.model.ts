/**
 * Model domain POS (SAP), port dari `sj-pos-katalog/src/app/core/models/product.model.ts`.
 *
 * Sengaja diberi prefix `Pos*` karena bentuknya sama sekali berbeda dengan
 * `Product`/`Customer` katalog buku di `product.model.ts` dan `customer.service.ts`
 * — ini item & business partner SAP, bukan entitas MalakaBooks.
 */

export interface PosItemGroup {
  id: number;
  code: string;
  description: string;
}

export interface PosUoMDetail {
  detailId: number;
  baseUoM_Id: number;
  baseQuantity: number;
  alternateQuantity: number;
  baseUoM: string;
  alternateUoM: string;
  uoMPackage?: number;
}

export interface PosUoMGroup {
  id: number;
  code: string;
  description: string;
  details: PosUoMDetail[];
}

/** Bentuk mentah dari `retail-api/api/Products/AutoFill`. */
export interface PosProductApi {
  code: string;
  name: string;
  itemGroupId: number;
  itemGroup: PosItemGroup;
  uoMGroupId: number;
  uoMGroup: PosUoMGroup;
  productImageUrl: string | null;
  lowestPrice: number;
  barcode?: string;
  barcode2?: string;
  barcode3?: string;
  barcode4?: string;
  isRokok?: boolean;
}

export const DEFAULT_CUSTOMER_CODE = 'RetailWS';

export interface PosProduct {
  id: string;
  name: string;
  price: number;
  uom: string;
  category: string;
  image: string;
  /** Dipakai validasi (mis. 102 untuk Rokok). */
  itemGroupCode?: string;
  description: string;
  uomOptions: string[];
  uomDetails: { name: string; package: number; conversion: number }[];
  barcode?: string;
  barcode2?: string;
  barcode3?: string;
  barcode4?: string;
  isRokok?: boolean;
}

export interface PosCartItem {
  id: string;
  name: string;
  uom: string;
  uomCode?: string;
  qty: number;
  price: number;
  subtotal: number;
  conversion: number;
  itemGroupCode?: string;
  isRokok?: boolean;
  basedSalesOrderDetailId?: number;
}

export interface PosCustomer {
  id?: string;
  Id?: string;
  code?: string;
  Code?: string;
  name?: string;
  Name?: string;
  CustomerName?: string;
  limitType?: number | string;
  LimitType?: number | string;
  creditLimit?: number;
  CreditLimit?: number;
  outstandingBills?: number;
  OutstandingBills?: number;
  overallPointReward?: number;
  DeliveryDays?: string;
  deliveryDays?: string;
  PaymentDays?: string;
  paymentDays?: string;
  PaymentDueDays?: number;
  paymentDueDays?: number;
  BPGroup?: { GroupType?: string };
  membershipBarcode?: string;
  MembershipBarcode?: string;
  [key: string]: any;
}

/** Baris struk dari `retail-api/api/SalesInvoices/print/{docNum}`. */
export interface PosBonItem {
  companyName: string | null;
  companyAddress: string | null;
  companyPhone1: string | null;
  companyPhone2: string | null;
  companyWebsite: string | null;
  docNum: string;
  docDate: string;
  docDueDate: string;
  deliveryDate: string;
  customerName: string;
  customerAddress: string | null;
  area: string | null;
  displayMembership: string;
  cashPayment: number;
  cashier: string;
  productName: string;
  quantity: number;
  baseQuantity: number;
  quantityScanned: number;
  uoM: string;
  bin: string | null;
  price: number;
  lineTotal: number;
  remarks: string;
  barcode: string | null;
  isScanned: boolean;
  boxUsed: number;
  point: number;
  pointReward: number;
  sortBy: number;
  lineStatus: number;
  dateCreated: string;
  cn: number;
  highestPrice: number;
  lineDiscAmount: number;
  transportType: string | null;
  membershipBarcode: string | null;
  itemGrouping: number;
  docTotal: number;
  docTime?: string;
}
