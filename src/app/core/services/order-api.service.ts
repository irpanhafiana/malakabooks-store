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
          firstValueFrom(this.http.post<any>(`${this.BASE_URL}/admin/Orders`, { pageNumber: 1, pageSize: 1000 })) || Promise.resolve({ data: { results: [] } }),
          this.userApi.getUsers()
        ]);
        const ordersRes = ordersEnvelope?.data?.results || [];
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

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const envelope = await firstValueFrom(
        this.http.get<any>(`${this.BASE_URL}/customer/Orders/${id}`)
      );
      const res = envelope?.data || null;
      if (!res) return null;

      const currentUser = getStoredSessionUser();
      let shippingAddress = {
        id: res.addressId,
        name: 'Address',
        phone: '',
        street: 'Unknown Street',
        city: '',
        province: '',
        postalCode: '',
        isDefault: false
      };
      if (currentUser) {
        const addresses = await this.userApi.getAddressesByUserId(currentUser.id);
        const matched = addresses.find(a => a.id === res.addressId);
        if (matched) {
          shippingAddress = matched;
        }
      }

      return {
        id: res.id,
        userId: res.userId,
        userName: currentUser ? currentUser.name : '',
        userEmail: currentUser ? currentUser.email : '',
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
    } catch (e) {
      console.error(`Gagal mengambil order detail untuk id ${id}:`, e);
      return null;
    }
  }

  async saveOrder(order: Order): Promise<Order> {
    const nameParts = (order.userName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const currentUser = getStoredSessionUser();
    const phone = currentUser?.phone || order.shippingAddress?.phone || '';

    const externalProfileId = localStorage.getItem('externalProfileId');
    const body: any = {
      userId: order.userId,
      firstName,
      lastName,
      phone,
      items: order.items.map(item => ({
        bookId: item.product.id,
        bookName: item.product.name,
        title: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      addressId: order.shippingAddress.id,
      note: '',
      shippingFee: order.shippingCost || 0,
      shippingCourier: order.shippingCourier || '',
      shippingType: order.shippingType || '',
      shippingEst: order.shippingEst || ''
    };

    if (externalProfileId) {
      body.id = externalProfileId;
    }

    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Orders`, body));
      
      const responseData = res?.data || {};
      const placedOrderId = responseData.orderId;
      
      if (!placedOrderId) {
         throw new Error('Order berhasil dibuat tapi gagal mengambil ID order dari server');
      }

      return {
        id: placedOrderId,
        userId: order.userId,
        userName: order.userName,
        userEmail: order.userEmail,
        items: order.items,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentDetails: order.paymentDetails,
        paymentUrl: responseData.paymentUrl,
        status: 'pending' as any,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        total: order.total,
        orderDate: new Date().toISOString()
      };
    } catch (e) {
      console.error('Gagal membuat order:', e);
      throw e;
    }
  }

  async createShipment(id: string): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/admin/Orders/${id}/shipment`, {})
      );
      return res?.data || res || null;
    } catch (e) {
      console.error(`Gagal membuat shipment untuk order ${id}:`, e);
      throw e;
    }
  }

  async createBulkShipment(orderIds: string[]): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/admin/Orders/shipment`, { orderIds })
      );
      return res?.data || res || null;
    } catch (e) {
      console.error('Gagal membuat bulk shipment:', e);
      throw e;
    }
  }
}

