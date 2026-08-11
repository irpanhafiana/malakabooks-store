import { Injectable, inject, signal, computed } from '@angular/core';
import { Order, OrderStatus } from '../core/models';
import { OrderApiService } from '../core/services/order-api.service';
import { AlertService } from '../core/services/alert.service';
import { CartStore } from './cart.store';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class OrderStore {
  private readonly orderApi = inject(OrderApiService);
  private readonly alertService = inject(AlertService);
  private readonly cartStore = inject(CartStore);

  private readonly state = signal<OrderState>({
    orders: [],
    currentOrder: null,
    loading: false,
    error: null
  });

  // Selectors
  readonly orders = computed(() => this.state().orders);
  readonly currentOrder = computed(() => this.state().currentOrder);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadUserOrders(userId: string) {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const orders = await this.orderApi.getOrdersByUserId(userId);
      this.state.update(s => ({ ...s, orders, loading: false, error: null }));
    } catch {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat data riwayat pesanan. Silakan coba lagi.' }));
    }
  }

  async loadOrderDetails(orderId: string) {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const order = await this.orderApi.getOrderById(orderId);
      this.state.update(s => ({ ...s, currentOrder: order, loading: false, error: null }));
    } catch {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat detail pesanan. Silakan coba lagi.' }));
    }
  }

  async loadAllOrders() {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const orders = await this.orderApi.getOrders();
      this.state.update(s => ({ ...s, orders, loading: false }));
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
    }
  }

  async placeOrder(orderData: Omit<Order, 'id' | 'orderDate' | 'status' | 'trackingNumber'>, options?: { showToast?: boolean }): Promise<Order | null> {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const fullOrder: Order = {
        ...orderData,
        id: '', // Filled by the API Mock database
        status: 'pending',
        orderDate: new Date().toISOString()
      };

      const placed = await this.orderApi.saveOrder(fullOrder);
      this.cartStore.clearCart(); // Reset cart item state
      this.state.update(s => ({
        ...s,
        orders: [placed, ...s.orders],
        currentOrder: placed,
        loading: false
      }));
      if (options?.showToast !== false) {
        this.alertService.success('Pesanan berhasil dibuat!');
      }
      return placed;
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      if (options?.showToast !== false) {
        this.alertService.error('Gagal membuat pesanan.');
      }
      return null;
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, options?: { showToast?: boolean }) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.orderApi.updateOrderStatus(orderId, status);
      if (success) {
        this.state.update(s => ({
          ...s,
          orders: s.orders.map(o => o.id === orderId ? { ...o, status } : o),
          loading: false
        }));
        if (options?.showToast !== false) {
          this.alertService.success(`Status pesanan #${orderId} diperbarui menjadi ${status}.`);
        }
      } else {
        // The API returns false for any failure (network/server), so we must not
        // claim "not found". Resync from the server to discard the optimistic
        // assumption and surface a generic, accurate error.
        this.state.update(s => ({ ...s, loading: false }));
        if (options?.showToast !== false) {
          this.alertService.error('Gagal memperbarui status pesanan. Silakan coba lagi.');
        }
        await this.loadAllOrders();
      }
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      if (options?.showToast !== false) {
        this.alertService.error('Gagal memperbarui status pesanan.');
      }
    }
  }

  async createShipment(orderId: string): Promise<unknown> {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const result = await this.orderApi.createShipment(orderId);
      this.state.update(s => ({ ...s, loading: false }));
      return result;
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      throw e;
    }
  }

  async createBulkShipments(orderIds: string[]): Promise<unknown> {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const result = await this.orderApi.createBulkShipment(orderIds);
      this.state.update(s => ({ ...s, loading: false }));
      return result;
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      throw e;
    }
  }

  async cancelShipment(orderId: string): Promise<unknown> {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const result = await this.orderApi.cancelShipment(orderId);
      this.state.update(s => ({ ...s, loading: false }));
      return result;
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      throw e;
    }
  }
  async getDetailResi(courier: string, awb: string): Promise<unknown> {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const result = await this.orderApi.detailResi(courier, awb);
      this.state.update(s => ({ ...s, loading: false }));
      return result;
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      throw e;
    }
  }
}
