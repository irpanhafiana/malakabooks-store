import { Injectable, inject, signal, computed } from '@angular/core';
import { WarehouseStock } from '../core/models';
import { WarehouseStockApiService } from '../core/services/warehouse-stock-api.service';
import { AlertService } from '../core/services/alert.service';

interface WarehouseStockState {
  stocks: WarehouseStock[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseStockStore {
  private readonly stockApi = inject(WarehouseStockApiService);
  private readonly alertService = inject(AlertService);

  private readonly state = signal<WarehouseStockState>({
    stocks: [],
    loading: false,
    error: null
  });

  readonly stocks = computed(() => this.state().stocks);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadWarehouseStocks() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const stocks = await this.stockApi.getWarehouseStocks();
      this.state.update(s => ({ ...s, stocks, loading: false, error: null }));
    } catch {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat warehouse stocks.' }));
      this.alertService.error('Gagal memuat stok gudang.');
    }
  }

  async saveWarehouseStock(stock: Partial<WarehouseStock>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      await this.stockApi.saveWarehouseStock(stock);
      await this.loadWarehouseStocks();
      this.alertService.success(`Stok gudang berhasil disimpan!`);
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      this.alertService.error('Gagal menyimpan stok gudang.');
    }
  }

  async deleteWarehouseStock(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.stockApi.deleteWarehouseStock(id);
      if (success) {
        await this.loadWarehouseStocks();
        this.alertService.success('Stok gudang berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.alertService.error('Stok gudang gagal dihapus.');
      }
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      this.alertService.error('Gagal menghapus stok gudang.');
    }
  }
}
