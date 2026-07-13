import { Injectable, inject, signal, computed } from '@angular/core';
import { CatalogItem } from '../core/models';
import { ItemApiService } from '../core/services/item-api.service';
import { ToastService } from '../core/services/toast.service';

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
  private readonly toastService = inject(ToastService);

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
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat catalog items.' }));
      this.toastService.error('Gagal memuat catalog items.');
    }
  }

  async saveItem(item: Partial<CatalogItem>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.itemApi.saveItem(item);
      await this.loadItems();
      this.toastService.success(`Item "${saved.name}" berhasil disimpan!`);
      return saved;
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menyimpan item.');
      throw e;
    }
  }

  async deleteItem(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.itemApi.deleteItem(id);
      if (success) {
        await this.loadItems();
        this.toastService.success('Item berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Item gagal dihapus.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menghapus item.');
    }
  }
}
