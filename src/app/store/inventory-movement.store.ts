import { Injectable, inject, signal, computed } from '@angular/core';
import { InventoryMovement } from '../core/models';
import { InventoryMovementApiService } from '../core/services/inventory-movement-api.service';
import { ToastService } from '../core/services/toast.service';

interface InventoryMovementState {
  movements: InventoryMovement[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryMovementStore {
  private readonly movementApi = inject(InventoryMovementApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<InventoryMovementState>({
    movements: [],
    loading: false,
    error: null
  });

  readonly movements = computed(() => this.state().movements);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadInventoryMovements(itemId?: string) {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const movements = await this.movementApi.getInventoryMovements(itemId);
      this.state.update(s => ({ ...s, movements, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat riwayat mutasi stok.' }));
      this.toastService.error('Gagal memuat riwayat mutasi stok.');
    }
  }
  async receiveGoods(payload: { itemId: string; quantity: number; referenceId?: string; note: string }): Promise<boolean> {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    const success = await this.movementApi.receiveGoods(payload);
    if (success) {
      this.toastService.success('Berhasil menyimpan data mutasi stok.');
      await this.loadInventoryMovements();
      return true;
    } else {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal menyimpan mutasi stok.' }));
      this.toastService.error('Gagal menyimpan mutasi stok.');
      return false;
    }
  }
}
