import { Injectable, inject, signal, computed } from '@angular/core';
import { Order, OrderStatus } from '../core/models';
import { OrderApiService } from '../core/services/order-api.service';
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
  private readonly orderApi = inject(OrderApiService);
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
      const orders = await this.orderApi.getOrdersByUserId(userId);
      this.state.update(s => ({ ...s, orders, loading: false }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to load your orders.');
    }
  }

  async loadOrderDetails(orderId: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const order = await this.orderApi.getOrderById(orderId);
      this.state.update(s => ({ ...s, currentOrder: order, loading: false }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to load order details.');
    }
  }

  async loadAllOrders() {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const orders = await this.orderApi.getOrders();
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

      const placed = await this.orderApi.saveOrder(fullOrder);
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
      const success = await this.orderApi.updateOrderStatus(orderId, status);
      if (success) {
        this.state.update(s => ({
          ...s,
          orders: s.orders.map(o => o.id === orderId ? { ...o, status } : o),
          loading: false
        }));
        this.toastService.success(`Order #${orderId} status updated to ${status}.`);
      } else {
        // The API returns false for any failure (network/server), so we must not
        // claim "not found". Resync from the server to discard the optimistic
        // assumption and surface a generic, accurate error.
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Failed to update order status. Please try again.');
        await this.loadAllOrders();
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to update order status.');
    }
  }
}
