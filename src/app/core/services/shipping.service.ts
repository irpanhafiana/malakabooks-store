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
      if (typeof service['price'] === 'number') {
        cost = service['price'];
      } else if (service['price'] && typeof service['price'] === 'object') {
        const priceObj = service['price'] as Record<string, number>;
        cost = priceObj['medium_price'] || priceObj['small_price'] || priceObj['large_price'] || 0;
      } else if (typeof service['cost'] === 'number') {
        cost = service['cost'];
      } else if (service['cost'] && Array.isArray(service['cost']) && service['cost'][0]) {
        const costItem = service['cost'][0] as Record<string, number>;
        cost = costItem['value'] || 0;
      } else if (service['cost'] && typeof service['cost'] === 'object') {
        const costObj = service['cost'] as Record<string, number>;
        cost = costObj['value'] || 0;
      } else if (typeof service.tariff === 'number') {
        cost = service.tariff;
      } else if (typeof service.tariff === 'string') {
        cost = parseFloat(service.tariff) || 0;
      }
    }

    if (cost > 0) {
      this.shippingCost.set(cost);
    } else {
      this.shippingCost.set(0);
    }
  }
}
