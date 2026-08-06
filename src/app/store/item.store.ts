import { Injectable, inject, signal, computed } from '@angular/core';
import { CatalogItem } from '../core/models';
import { ItemApiService } from '../core/services/item-api.service';
import { AlertService } from '../core/services/alert.service';

interface ItemState {
  items: CatalogItem[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ItemStore {
  private readonly itemApi = inject(ItemApiService);
  private readonly alertService = inject(AlertService);

  private readonly state = signal<ItemState>({
    items: [],
    loading: false,
    error: null
  });

  readonly items = computed(() => this.state().items);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadItems() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const items = await this.itemApi.getItems();
      this.state.update(s => ({ ...s, items, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat produk.' }));
    }
  }

  async saveItem(item: Partial<CatalogItem>, options?: { showToast?: boolean }) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.itemApi.saveItem(item);
      await this.loadItems();
      if (options?.showToast !== false) {
        this.alertService.success(`Produk berhasil disimpan!`);
      }
      return saved;
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      if (options?.showToast !== false) {
        this.alertService.error('Gagal menyimpan produk.');
      }
      throw e;
    }
  }

  async deleteItem(id: string, options?: { showToast?: boolean }) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.itemApi.deleteItem(id);
      if (success) {
        await this.loadItems();
        if (options?.showToast !== false) {
          this.alertService.success('Item berhasil dihapus.');
        }
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        if (options?.showToast !== false) {
          this.alertService.error('Item gagal dihapus.');
        }
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      if (options?.showToast !== false) {
        this.alertService.error('Gagal menghapus item.');
      }
    }
  }
}
