import { signal, computed, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

export interface GenericCrudState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

export interface CrudApiService<T> {
  getAll(): Promise<T[]>;
  save(item: Partial<T>, file?: File): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export abstract class BaseCrudStore<T extends { id?: string; name?: string; title?: string }> {
  protected abstract readonly api: CrudApiService<T>;
  protected readonly toastService = inject(ToastService);
  protected abstract readonly entityName: string;

  protected readonly state = signal<GenericCrudState<T>>({
    items: [],
    loading: false,
    error: null
  });

  readonly items = computed(() => this.state().items);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async load() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const items = await this.api.getAll();
      this.state.update(s => ({ ...s, items, loading: false, error: null }));
    } catch {
      const errorMsg = `Gagal memuat daftar ${this.entityName}.`;
      this.state.update(s => ({ ...s, loading: false, error: errorMsg }));
      this.toastService.error(errorMsg);
    }
  }

  async save(item: Partial<T>, file?: File) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.api.save(item, file);
      await this.load();
      const displayName = saved.name || saved.title || this.entityName;
      this.toastService.success(`${this.entityName} "${displayName}" berhasil disimpan!`);
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error(`Gagal menyimpan ${this.entityName}.`);
    }
  }

  async delete(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.api.delete(id);
      if (success) {
        await this.load();
        this.toastService.success(`${this.entityName} berhasil dihapus.`);
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error(`${this.entityName} tidak ditemukan.`);
      }
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error(`Gagal menghapus ${this.entityName}.`);
    }
  }
}
