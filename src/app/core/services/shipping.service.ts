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

  async calculateCost(districtCode: string | null, courier: string | null): Promise<number> {
    if (!districtCode || !courier) {
      this.shippingCost.set(0);
      return 0;
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
        berat_paket: "10", // kept as 10 as per original calculation logic
        volume: '1x1x1',
        ekspedisi: courier
      });

      let cost = 0;
      if (tariffRes) {
        if (Array.isArray(tariffRes)) {
          const first = tariffRes[0];
          cost = typeof first.cost === 'number' ? first.cost : (first.cost?.[0]?.value || 0);
        } else if (tariffRes.costs && Array.isArray(tariffRes.costs)) {
          const first = tariffRes.costs[0];
          cost = typeof first.cost === 'number' ? first.cost : (first.cost?.[0]?.value || 0);
        } else if (tariffRes.rajaongkir?.results?.[0]?.costs?.[0]?.cost?.[0]?.value) {
          cost = tariffRes.rajaongkir.results[0].costs[0].cost[0].value;
        } else if (typeof tariffRes.cost === 'number') {
          cost = tariffRes.cost;
        } else if (typeof tariffRes.price === 'number') {
          cost = tariffRes.price;
        }
      }

      if (cost > 0) {
        let costUsd = cost;
        if (cost >= 1000) {
          costUsd = cost / 15000;
        }
        this.shippingCost.set(costUsd);
        return costUsd;
      } else {
        this.shippingCost.set(5.00);
        return 5.00;
      }
    } catch (e) {
      console.error('Failed to calculate shipping cost:', e);
      this.shippingCost.set(5.00);
      return 5.00;
    } finally {
      this.shippingLoading.set(false);
    }
  }
}
