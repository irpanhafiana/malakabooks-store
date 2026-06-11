import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getStoredSessionUser } from '../auth/session.util';
import { UserApiService } from './user-api.service';

@Injectable({
  providedIn: 'root'
})
export class OrderApiService {
  private readonly http = inject(HttpClient);
  private readonly userApi = inject(UserApiService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.put(`${this.BASE_URL}/admin/Orders/${id}/status`, { status }));
      return true;
    } catch (e) {
      console.error(`Gagal update status order ${id}:`, e);
      return false;
    }
  }

  async getOrders(): Promise<Order[]> {
    const currentUser = getStoredSessionUser();
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      try {
        const [ordersEnvelope, users] = await Promise.all([
          firstValueFrom(this.http.get<any>(`${this.BASE_URL}/admin/Orders`)) || Promise.resolve({ data: [] }),
          this.userApi.getUsers()
        ]);
        const ordersRes = ordersEnvelope?.data || [];
        const userMap = new Map(users.map(u => [u.id, u]));

        return ordersRes.map((res: any) => {
          const u = userMap.get(res.userId);
          return {
            id: res.id,
            userId: res.userId,
            userName: u ? u.name : 'Unknown User',
            userEmail: u ? (u.email || u.phone || 'No Contact') : '',
            items: res.items.map((item: any) => ({
              product: {
                id: item.bookId,
                name: item.title,
                description: '',
                price: item.price,
                images: [],
                categoryId: '',
                categoryName: '',
                stock: 0,
                rating: 5,
                reviewsCount: 0,
                featured: false,
                brand: '',
                specifications: {},
                createdAt: ''
              },
              quantity: item.quantity
            })),
            shippingAddress: {
              id: res.addressId || 'addr-default',
              name: u ? u.name : 'Customer Address',
              phone: u ? u.phone || '' : '',
              street: res.note || 'Default Address',
              city: '',
              province: '',
              postalCode: '',
              isDefault: false
            },
            paymentMethod: 'bank_transfer',
            status: res.status as any,
            subtotal: res.totalPrice,
            shippingCost: 0,
            tax: 0,
            total: res.totalPrice,
            orderDate: res.createdAt
          };
        });
      } catch (e) {
        console.error('Gagal mengambil semua order (admin):', e);
        return this.getOrdersByUserId(currentUser.id);
      }
    } else {
      return this.getOrdersByUserId(currentUser.id);
    }
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      const ordersResRaw = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Orders/user/${userId}`));
      const ordersRes = ordersResRaw?.data || [];
      const addresses = await this.userApi.getAddressesByUserId(userId);
      
      const addrMap = new Map(addresses.map(a => [a.id, a]));
      
      return (ordersRes || []).map((res: any) => {
        const shippingAddress = addrMap.get(res.addressId) || {
          id: res.addressId,
          name: 'Address',
          phone: '',
          street: 'Unknown Street',
          city: '',
          province: '',
          postalCode: '',
          isDefault: false
        };
        
        return {
          id: res.id,
          userId: res.userId,
          userName: '',
          userEmail: '',
          items: res.items.map((item: any) => ({
            product: {
              id: item.bookId,
              name: item.title,
              description: '',
              price: item.price,
              images: [],
              categoryId: '',
              categoryName: '',
              stock: 0,
              rating: 5,
              reviewsCount: 0,
              featured: false,
              brand: '',
              specifications: {},
              createdAt: ''
            },
            quantity: item.quantity
          })),
          shippingAddress,
          paymentMethod: 'bank_transfer',
          status: res.status as any,
          subtotal: res.totalPrice,
          shippingCost: 0,
          tax: 0,
          total: res.totalPrice,
          orderDate: res.createdAt
        };
      });
    } catch (e) {
      console.error(`Gagal mengambil order untuk user ${userId}:`, e);
      return [];
    }
  }

  async saveOrder(order: Order): Promise<Order> {
    const body = {
      userId: order.userId,
      items: order.items.map(item => ({
        bookId: item.product.id,
        title: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      addressId: order.shippingAddress.id,
      note: ''
    };

    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Orders`, body));
      const placed = res?.data;
      
      return {
        id: placed.id,
        userId: placed.userId,
        userName: order.userName,
        userEmail: order.userEmail,
        items: order.items,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentDetails: order.paymentDetails,
        status: placed.status as any,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        total: Number(placed.totalPrice) || order.total,
        orderDate: placed.createdAt
      };
    } catch (e) {
      console.error('Gagal membuat order:', e);
      throw e;
    }
  }
}
