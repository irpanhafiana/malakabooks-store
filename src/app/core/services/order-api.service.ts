import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { getStoredSessionUser } from '../auth/session.util';
import { UserApiService } from './user-api.service';

@Injectable({
  providedIn: 'root'
})
export class OrderApiService {
  private readonly http = inject(HttpClient);
  private readonly userApi = inject(UserApiService);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.put(`${this.BASE_URL}/admin/Orders/${id}/status`, { status }));
      return true;
    } catch (e) {
      this.logger.error('OrderApiService.updateOrderStatus', `Gagal update status order ${id}:`, e);
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
            userName: u ? u.name : (res.user ? `${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() : 'Unknown User') || 'Unknown User',
            userEmail: u ? (u.email || u.phone || 'No Contact') : (res.user?.phone || 'No Contact'),
            items: res.items.map((item: any) => ({
              product: {
                id: item.bookId,
                name: item.title,
                description: '',
                price: item.price,
                images: item.coverImage ? [item.coverImage] : [],
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
            orderDate: res.createdAt,
            trackingNumber: res.awbNo || res.aWBNo || res.AWBNo || res.trackingNumber,
            shippingCourier: res.shippingCourier || res.ShippingCourier || ''
          };
        });
      } catch (e) {
        this.logger.error('OrderApiService.getOrders', 'Gagal mengambil semua order (admin):', e);
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
          userName: res.user ? `${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() : 'Unknown User',
          userEmail: res.user?.phone || 'No Contact',
          items: res.items.map((item: any) => ({
            product: {
              id: item.bookId,
              name: item.title,
              description: '',
              price: item.price,
              images: item.coverImage ? [item.coverImage] : [],
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
          orderDate: res.createdAt,
          trackingNumber: res.awbNo || res.aWBNo || res.AWBNo || res.trackingNumber
        };
      });
    } catch (e) {
      this.logger.error('OrderApiService.getOrdersByUserId', `Gagal mengambil order untuk user ${userId}:`, e);
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
            images: item.coverImage ? [item.coverImage] : [],
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
        orderDate: res.createdAt,
        trackingNumber: res.awbNo || res.awbNo || res.trackingNumber
      };
    } catch (e) {
      this.logger.error('OrderApiService.getOrderById', `Gagal mengambil order detail untuk id ${id}:`, e);
      return null;
    }
  }

  async saveOrder(order: Order): Promise<Order> {
    const externalProfileId = localStorage.getItem('externalProfileId');
    const body: any = {
      userId: order.userId,
      items: order.items.map(item => ({
        itemId: item.product.id,
        itemName: item.product.title,
        title: item.product.title,
        uomCode: item.uomCode || item.product.baseUomCode || '',
        price: item.product.price,
        quantity: item.quantity
      })),
      addressId: order.shippingAddress.id,
      paymentId: order.paymentMethod,
      note: '',
      shippingCourier: order.shippingCourier || '',
      shippingType: order.shippingType || '',
      shippingEst: order.shippingEst || '',
      shippingFee: order.shippingCost || 0,
      insurance: true,
      shippingInsurance: 0
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
      this.logger.error('OrderApiService.saveOrder', 'Gagal membuat order:', e);
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
      this.logger.error('OrderApiService.createShipment', `Gagal membuat shipment untuk order ${id}:`, e);
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
      this.logger.error('OrderApiService.createBulkShipment', 'Gagal membuat bulk shipment:', e);
      throw e;
    }
  }

  async cancelShipment(id: string): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/admin/Orders/${id}/shipment/cancel`, {})
      );
      return res?.data || res || null;
    } catch (e) {
      this.logger.error('OrderApiService.cancelShipment', `Gagal membatalkan shipment untuk order ${id}:`, e);
      throw e;
    }
  }

  async trackAwb(awb: string): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.BASE_URL}/customer/Simasrim/TrackAwb/${awb}`)
      );
      return res?.data || res || null;
    } catch (e) {
      this.logger.error('OrderApiService.trackAwb', `Gagal tracking AWB ${awb}:`, e);
      throw e;
    }
  }

  async detailResi(courier: string, awb: string): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/admin/Orders/shipment/detail-resi`, { ekspedisi: courier, awb: awb })
      );
      return res?.data || res || null;
    } catch (e) {
      this.logger.error('OrderApiService.detailResi', `Gagal detail resi ${courier}/${awb}:`, e);
      throw e;
    }
  }
}

