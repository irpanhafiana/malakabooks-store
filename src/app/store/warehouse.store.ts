import { Injectable, inject, signal, computed } from '@angular/core';
import { Warehouse } from '../core/models';
import { WarehouseApiService } from '../core/services/warehouse-api.service';
import { ToastService } from '../core/services/toast.service';

interface WarehouseState {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseStore {
  private readonly warehouseApi = inject(WarehouseApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<WarehouseState>({
    warehouses: [],
    loading: false,
    error: null
  });

  readonly warehouses = computed(() => this.state().warehouses);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadWarehouses() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const warehouses = await this.warehouseApi.getWarehouses();
      this.state.update(s => ({ ...s, warehouses, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat daftar gudang.' }));
      this.toastService.error('Gagal memuat daftar gudang.');
    }
  }

  async saveWarehouse(warehouse: Partial<Warehouse>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.warehouseApi.saveWarehouse(warehouse);
      await this.loadWarehouses();
      this.toastService.success(`Gudang "${saved.name}" berhasil disimpan!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menyimpan gudang.');
    }
  }

  async deleteWarehouse(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.warehouseApi.deleteWarehouse(id);
      if (success) {
        await this.loadWarehouses();
        this.toastService.success('Gudang berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Gudang gagal dihapus.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menghapus gudang.');
    }
  }
}
