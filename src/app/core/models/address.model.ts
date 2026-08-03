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
  addressCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface ProvinceLocation {
  prov_id?: string;
  prov_name?: string;
}

export interface CityLocation {
  city_id?: string;
  city_name?: string;
  prov_id?: string;
}

export interface DistrictLocation {
  district_id?: string;
  district_name?: string;
  city_id?: string;
  sub_district_id?: string;
  subdistrict_name?: string;
  sub_district_name?: string;
  postal_code?: string;
  address_code?: string;
  region_code?: string;
  origin_code?: string;
  latitude?: number | string;
  longitude?: number | string;
}

export interface ShippingTariffPayload {
  origin_code: string;
  desti_code: string;
  berat_paket: string;
  volume: string;
  ekspedisi: string;
}

export interface ShippingTariffCostItem {
  value?: number;
  etd?: string;
  note?: string;
}

export interface ShippingTariffItem {
  service?: string;
  service_name?: string;
  service_code?: string;
  service_display?: string;
  tariff?: number | string;
  etd?: string;
  cost?: number | ShippingTariffCostItem[] | { value?: number };
  price?: number | { medium_price?: number; small_price?: number; large_price?: number };
}


