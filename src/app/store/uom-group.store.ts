import { Injectable, inject, signal, computed } from '@angular/core';
import { UomGroup } from '../core/models';
import { UomGroupApiService } from '../core/services/uom-group-api.service';
import { ToastService } from '../core/services/toast.service';

interface UomGroupState {
  uomGroups: UomGroup[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UomGroupStore {
  private readonly uomGroupApi = inject(UomGroupApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<UomGroupState>({
    uomGroups: [],
    loading: false,
    error: null
  });

  readonly uomGroups = computed(() => this.state().uomGroups);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadUomGroups() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const uomGroups = await this.uomGroupApi.getUomGroups();
      this.state.update(s => ({ ...s, uomGroups, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat satuan ukuran.' }));
      this.toastService.error('Gagal memuat satuan ukuran.');
    }
  }

  async saveUomGroup(uomGroup: Partial<UomGroup>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.uomGroupApi.saveUomGroup(uomGroup);
      await this.loadUomGroups();
      this.toastService.success(`Satuan ukuran "${saved.name}" berhasil disimpan!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menyimpan satuan ukuran.');
    }
  }

  async deleteUomGroup(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.uomGroupApi.deleteUomGroup(id);
      if (success) {
        await this.loadUomGroups();
        this.toastService.success('Satuan ukuran berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Satuan ukuran gagal dihapus.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menghapus satuan ukuran.');
    }
  }
}
