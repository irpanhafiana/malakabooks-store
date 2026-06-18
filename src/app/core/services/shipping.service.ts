import { Injectable, inject, signal } from '@angular/core';
import { AddressApiService } from './address-api.service';
import { environment } from '../../../environments/environment';
import { CartStore } from '../../store/cart.store';

@Injectable({
  providedIn: 'root'
})
export class ShippingService {
  private readonly addressApi = inject(AddressApiService);
  private readonly cartStore = inject(CartStore);

  readonly provinces = signal<any[]>([]);
  readonly cities = signal<any[]>([]);
  readonly districts = signal<any[]>([]);
  readonly courierServices = signal<any[]>([]);
  
  readonly shippingCost = signal<number>(0);
  readonly shippingLoading = signal<boolean>(false);

  async loadProvinces(): Promise<any[]> {
    const provs = await this.addressApi.getProvinces();
    this.provinces.set(provs);
    return provs;
  }

  async loadCities(province: string): Promise<any[]> {
    const cts = await this.addressApi.getCities(province);
    this.cities.set(cts);
    return cts;
  }

  async loadDistricts(city: string): Promise<any[]> {
    const dsts = await this.addressApi.getDistricts(city);
    this.districts.set(dsts);
    return dsts;
  }

  clearCities() {
    this.cities.set([]);
  }

  clearDistricts() {
    this.districts.set([]);
  }

  async fetchCourierServices(districtCode: string | null, courier: string | null): Promise<any[]> {
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
        const specWeight = item.product.specifications?.['weight'];
        const itemWeight = specWeight ? parseFloat(specWeight) : 500;
        totalWeight += itemWeight * item.quantity;
      }
      if (totalWeight <= 0) totalWeight = 1000;

      const tariffRes = await this.addressApi.calculateTariff({
        origin_code: environment.originCode,
        desti_code: districtCode,
        berat_paket: "10",
        volume: '1x1x1',
        ekspedisi: courier
      });

      let services = [];
      if (tariffRes) {
        if (tariffRes[courier] && Array.isArray(tariffRes[courier])) {
           services = tariffRes[courier];
        } else if (tariffRes.data && tariffRes.data[courier] && Array.isArray(tariffRes.data[courier])) {
           services = tariffRes.data[courier];
        } else if (Array.isArray(tariffRes)) {
           services = tariffRes; 
        } else if (tariffRes.costs && Array.isArray(tariffRes.costs)) {
           services = tariffRes.costs;
        } else if (tariffRes.rajaongkir?.results?.[0]?.costs) {
           services = tariffRes.rajaongkir.results[0].costs;
        }
      }

      this.courierServices.set(services);
      this.shippingCost.set(0);
      return services;
    } catch (e) {
      console.error('Failed to fetch courier services:', e);
      this.courierServices.set([]);
      this.shippingCost.set(0);
      return [];
    } finally {
      this.shippingLoading.set(false);
    }
  }

  setShippingCostFromService(service: any) {
    let cost = 0;
    if (service) {
      if (typeof service.price === 'number') {
        cost = service.price;
      } else if (service.price && typeof service.price === 'object') {
        cost = service.price.medium_price || service.price.small_price || service.price.large_price || 0;
      } else if (typeof service.cost === 'number') {
        cost = service.cost;
      } else if (service.cost && Array.isArray(service.cost) && service.cost[0]) {
        cost = service.cost[0].value || 0;
      } else if (service.cost && typeof service.cost === 'object') {
        cost = service.cost.value || 0;
      }
    }
    
    if (cost > 0) {
      let costUsd = cost;
      if (cost >= 1000) {
        costUsd = cost / 15000;
      }
      this.shippingCost.set(costUsd);
    } else {
      this.shippingCost.set(0);
    }
  }
}
