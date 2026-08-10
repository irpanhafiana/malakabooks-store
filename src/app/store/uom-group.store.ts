import { Injectable, inject, signal, computed } from '@angular/core';
import { UomGroup } from '../core/models';
import { UomGroupApiService } from '../core/services/uom-group-api.service';
import { AlertService } from '../core/services/alert.service';

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
  private readonly alertService = inject(AlertService);

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
    } catch {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat satuan ukuran.' }));
      this.alertService.error('Gagal memuat satuan ukuran.');
    }
  }

  async saveUomGroup(uomGroup: Partial<UomGroup>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.uomGroupApi.saveUomGroup(uomGroup);
      await this.loadUomGroups();
      this.alertService.success(`Satuan ukuran "${saved.name}" berhasil disimpan!`);
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      this.alertService.error('Gagal menyimpan satuan ukuran.');
    }
  }

  async deleteUomGroup(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.uomGroupApi.deleteUomGroup(id);
      if (success) {
        await this.loadUomGroups();
        this.alertService.success('Satuan ukuran berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.alertService.error('Satuan ukuran gagal dihapus.');
      }
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      this.alertService.error('Gagal menghapus satuan ukuran.');
    }
  }
}
