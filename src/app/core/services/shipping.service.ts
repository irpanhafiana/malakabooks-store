import { Injectable, inject, signal } from '@angular/core';
import { AddressApiService } from './address-api.service';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { CartStore } from '../../store/cart.store';
import {
  ProvinceLocation,
  CityLocation,
  DistrictLocation,
  ShippingTariffItem
} from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class ShippingService {
  private readonly addressApi = inject(AddressApiService);
  private readonly cartStore = inject(CartStore);
  private readonly logger = inject(LoggerService);

  readonly provinces = signal<ProvinceLocation[]>([]);
  readonly cities = signal<CityLocation[]>([]);
  readonly districts = signal<DistrictLocation[]>([]);
  readonly courierServices = signal<ShippingTariffItem[]>([]);

  readonly shippingCost = signal<number>(0);
  readonly shippingLoading = signal<boolean>(false);

  async loadProvinces(): Promise<ProvinceLocation[]> {
    const provs = await this.addressApi.getProvinces();
    this.provinces.set(provs);
    return provs;
  }

  async loadCities(province: string): Promise<CityLocation[]> {
    const cts = await this.addressApi.getCities(province);
    this.cities.set(cts);
    return cts;
  }

  async loadDistricts(province: string, city: string): Promise<DistrictLocation[]> {
    const dsts = await this.addressApi.getDistricts(province, city);
    this.districts.set(dsts);
    return dsts;
  }

  clearCities() {
    this.cities.set([]);
  }

  clearDistricts() {
    this.districts.set([]);
  }

  async fetchCourierServices(districtCode: string | null, courier: string | null): Promise<ShippingTariffItem[]> {
    if (!districtCode || !courier) {
      this.courierServices.set([]);
      this.shippingCost.set(0);
      return [];
    }

    try {
      this.shippingLoading.set(true);

      const items = this.cartStore.items();
      let totalWeight = 0;
      for (const item of items) {
        const itemWeight = item.product.weight || 500;
        totalWeight += itemWeight * item.quantity;
      }
      if (totalWeight <= 0) totalWeight = 1000;

      let totalVolumeQty = 0;
      for (const item of items) {
        totalVolumeQty += item.quantity;
      }

      // Asumsi standar dimensi buku 20x15x3 cm per item
      const length = 20;
      const width = 15;
      const height = Math.max(3, 3 * totalVolumeQty);
      const volumeString = `${length}x${width}x${height}`;

      let activeOriginCode = environment.originCode;
      try {
        const homeAddresses = await this.addressApi.getStoreHomeAddresses();
        if (homeAddresses && homeAddresses.length > 0 && homeAddresses[0].addressCode) {
          activeOriginCode = homeAddresses[0].addressCode;
        }
      } catch (err) {
        this.logger.error('ShippingService', 'Failed to load home addresses, fallback to env originCode', err);
      }

      const tariffRes = await this.addressApi.calculateTariff({
        origin_code: activeOriginCode,
        desti_code: districtCode,
        berat_paket: totalWeight.toString(),
        volume: volumeString,
        ekspedisi: courier
      });

      let services: ShippingTariffItem[] = [];
      if (tariffRes) {
        const resAny = tariffRes as Record<string, unknown>;
        if (resAny[courier] && Array.isArray(resAny[courier])) {
          services = resAny[courier] as ShippingTariffItem[];
        } else if (resAny['data'] && typeof resAny['data'] === 'object' && resAny['data'] !== null) {
          const dataObj = resAny['data'] as Record<string, unknown>;
          if (dataObj[courier] && Array.isArray(dataObj[courier])) {
            services = dataObj[courier] as ShippingTariffItem[];
          }
        } else if (Array.isArray(tariffRes)) {
          services = tariffRes as ShippingTariffItem[];
        } else if (resAny['costs'] && Array.isArray(resAny['costs'])) {
          services = resAny['costs'] as ShippingTariffItem[];
        }
      }

      this.courierServices.set(services);
      this.shippingCost.set(0);
      return services;
    } catch (e) {
      this.logger.error('ShippingService.fetchCourierServices', 'Failed to fetch courier services:', e);
      this.courierServices.set([]);
      this.shippingCost.set(0);
      return [];
    } finally {
      this.shippingLoading.set(false);
    }
  }

  setShippingCostFromService(service: ShippingTariffItem | null) {
    let cost = 0;
    if (service) {
      cost = this.extractServicePrice(service);
    }
    this.shippingCost.set(cost > 0 ? cost : 0);
  }

  extractServicePrice(s: ShippingTariffItem): number {
    if (!s) return 0;
    let price = 0;
    if (typeof s['price'] === 'number') {
      price = s['price'];
    } else if (s['price'] && typeof s['price'] === 'object') {
      const pObj = s['price'] as Record<string, number>;
      price = pObj['medium_price'] || pObj['small_price'] || pObj['large_price'] || 0;
    } else if (typeof s['cost'] === 'number') {
      price = s['cost'];
    } else if (s['cost'] && Array.isArray(s['cost'])) {
      const cArr = s['cost'] as Record<string, number>[];
      price = cArr[0]?.['value'] || 0;
    } else if (s['cost'] && typeof s['cost'] === 'object') {
      const cObj = s['cost'] as Record<string, number>;
      price = cObj['value'] || 0;
    } else if (typeof s.tariff === 'number') {
      price = s.tariff;
    } else if (typeof s.tariff === 'string') {
      price = parseFloat(s.tariff) || 0;
    }
    return price;
  }

  async resolveDistrictForAddress(addr: { provinceName?: string; city?: string; district?: string }): Promise<string> {
    if (!addr.provinceName || !addr.city || !addr.district) return '';
    try {
      const districts = await this.addressApi.getDistricts(addr.provinceName, addr.city);
      const match = districts.find(d =>
        d.district_name === addr.district ||
        d.subdistrict_name === addr.district ||
        (d.region_code && d.region_code === addr.district)
      );
      return match ? (match.region_code || match.address_code || match.district_id || '') : '';
    } catch {
      return '';
    }
  }
}
