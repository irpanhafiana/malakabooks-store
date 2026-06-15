import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, Address, RegisterPayload } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getStoredSessionUser } from '../auth/session.util';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getAddressesByUserId(userId: string): Promise<Address[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Addresses/user/${userId}`));
      const list = envelope?.data || [];
      return list.map((addr: any) => ({
        id: addr.id,
        name: addr.label,
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        province: addr.province,
        district: addr.district,
        subDistrict: addr.subDistrict,
        postalCode: addr.postalCode,
        isDefault: addr.isDefault
      }));
    } catch (e) {
      console.error(`Gagal mengambil alamat untuk user ${userId}:`, e);
      return [];
    }
  }

  async register(payload: RegisterPayload): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.BASE_URL}/customer/Users`, payload)
    );
  }

  async getUsers(): Promise<User[]> {
    const currentUser = getStoredSessionUser();
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      try {
        const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/admin/Users`));
        const list = envelope?.data || [];
        return list.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
          email: u.email || '',
          role: this.authApi.normalizeRole(u.role),
          phone: u.phone || '',
          avatar: u.avatar || '',
          joinedAt: u.createdAt,
          addresses: []
        }));
      } catch (e) {
        console.error('Gagal mengambil semua user (admin):', e);
        return [];
      }
    } else {
      const user = await this.getUserById(currentUser.id);
      return user ? [user] : [];
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Users/${id}/profile`));
      const userRes = envelope?.data;
      if (!userRes) return undefined;
      const addresses = await this.getAddressesByUserId(id);
      return {
        id: userRes.id,
        name: `${userRes.firstName || ''} ${userRes.lastName || ''}`.trim() || 'User',
        email: userRes.email || '',
        role: this.authApi.normalizeRole(userRes.role),
        phone: userRes.phone || '',
        avatar: userRes.avatar || '',
        joinedAt: userRes.createdAt,
        addresses: addresses
      };
    } catch (e) {
      console.error(`Gagal mengambil detail user ${id}:`, e);
      return undefined;
    }
  }

  async saveUser(user: User): Promise<User> {
    const nameParts = (user.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const profileBody = {
      firstName: firstName,
      lastName: lastName,
      avatar: user.avatar || ''
    };

    try {
      await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/customer/Users/${user.id}/profile`, profileBody));
      
      const backendAddresses = await this.getAddressesByUserId(user.id);
      const backendAddrMap = new Map(backendAddresses.map(a => [a.id, a]));
      
      for (const addr of user.addresses) {
        const isNew = !addr.id || addr.id.startsWith('addr-');
        const addressBody = {
          userId: user.id,
          label: addr.name,
          recipientName: user.name,
          phone: addr.phone,
          street: addr.street,
          city: addr.city,
          province: addr.province,
          district: addr.district || '',
          subDistrict: addr.subDistrict || '',
          postalCode: addr.postalCode,
          isDefault: addr.isDefault
        };
        
        if (isNew) {
          await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Addresses`, addressBody));
        } else {
          await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/customer/Addresses/${addr.id}`, addressBody));
          backendAddrMap.delete(addr.id);
        }
      }
      
      for (const [id, _] of backendAddrMap.entries()) {
        try {
          await firstValueFrom(this.http.delete(`${this.BASE_URL}/customer/Addresses/${id}`));
        } catch (e) {
          console.error(`Gagal menghapus alamat ${id}:`, e);
        }
      }

      const updatedAddresses = await this.getAddressesByUserId(user.id);

      return {
        ...user,
        addresses: updatedAddresses
      };
    } catch (e) {
      console.error('Gagal menyimpan user/alamat:', e);
      throw e;
    }
  }

  async addAddress(userId: string, userName: string, addr: Address): Promise<boolean> {
    const addressBody = {
      userId: userId,
      label: addr.name,
      recipientName: userName,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      province: addr.province,
      district: addr.district || '',
      subDistrict: addr.subDistrict || '',
      postalCode: addr.postalCode,
      isDefault: addr.isDefault
    };
    try {
      await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Addresses`, addressBody));
      return true;
    } catch (e) {
      console.error('Failed to add address:', e);
      return false;
    }
  }

  async updateAddress(userId: string, userName: string, addr: Address): Promise<boolean> {
    const addressBody = {
      userId: userId,
      label: addr.name,
      recipientName: userName,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      province: addr.province,
      district: addr.district || '',
      subDistrict: addr.subDistrict || '',
      postalCode: addr.postalCode,
      isDefault: addr.isDefault
    };
    try {
      await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/customer/Addresses/${addr.id}`, addressBody));
      return true;
    } catch (e) {
      console.error('Failed to update address:', e);
      return false;
    }
  }

  async deleteAddress(addressId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/customer/Addresses/${addressId}`));
      return true;
    } catch (e) {
      console.error('Failed to delete address:', e);
      return false;
    }
  }
}
