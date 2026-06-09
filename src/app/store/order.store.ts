import { Injectable, inject, signal, computed } from '@angular/core';
import { Order, OrderStatus } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { CartStore } from './cart.store';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrderStore {
  private readonly apiService = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly cartStore = inject(CartStore);

  private readonly state = signal<OrderState>({
    orders: [],
    currentOrder: null,
    loading: false
  });

  // Selectors
  readonly orders = computed(() => this.state().orders);
  readonly currentOrder = computed(() => this.state().currentOrder);
  readonly loading = computed(() => this.state().loading);

  async loadUserOrders(userId: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const orders = await this.apiService.getOrdersByUserId(userId);
      this.state.update(s => ({ ...s, orders, loading: false }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to load your orders.');
    }
  }

  async loadAllOrders() {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const orders = await this.apiService.getOrders();
      this.state.update(s => ({ ...s, orders, loading: false }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to load admin orders.');
    }
  }

  async placeOrder(orderData: Omit<Order, 'id' | 'orderDate' | 'status' | 'trackingNumber'>): Promise<Order | null> {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const fullOrder: Order = {
        ...orderData,
        id: '', // Filled by the API Mock database
        status: 'pending',
        orderDate: new Date().toISOString()
      };

      const placed = await this.apiService.saveOrder(fullOrder);
      this.cartStore.clearCart(); // Reset cart item state
      this.state.update(s => ({
        ...s,
        orders: [placed, ...s.orders],
        currentOrder: placed,
        loading: false
      }));
      this.toastService.success('Order placed successfully!');
      return placed;
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to place order.');
      return null;
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.apiService.updateOrderStatus(orderId, status);
      if (success) {
        this.state.update(s => ({
          ...s,
          orders: s.orders.map(o => o.id === orderId ? { ...o, status } : o),
          loading: false
        }));
        this.toastService.success(`Order #${orderId} status updated to ${status}.`);
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Order not found.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to update order status.');
    }
  }
}
