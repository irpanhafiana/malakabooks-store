import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, Address, RegisterPayload, ApiResponse, AddressResponseDto, UserResponseDto } from '../models';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getStoredSessionUser } from '../auth/session.util';
import { AuthApiService } from './auth-api.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  /** Fetch external profile ID from the payment/external system */
  getExternalProfile(phone: string): Observable<ApiResponse<UserResponseDto>> {
    return this.http.get<ApiResponse<UserResponseDto>>(`${this.BASE_URL}/customer/Users/${phone}/profile`);
  }

  async getAddressesByUserId(userId: string): Promise<Address[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<ApiResponse<AddressResponseDto[]>>(`${this.BASE_URL}/customer/Addresses/user/${userId}`));
      const list = envelope?.data;
      if (!Array.isArray(list)) return [];
      return list.map((addr: any): Address => ({
        id: addr.id || addr.Id || '',
        name: addr.label || addr.Label || addr.recipientName || addr.RecipientName || 'Alamat',
        phone: addr.phone || addr.Phone || '',
        street: addr.street || addr.Street || '',
        city: addr.city || addr.City || '',
        province: addr.province || addr.Province || '',
        district: addr.district || addr.District || '',
        subDistrict: addr.subDistrict || addr.SubDistrict || '',
        postalCode: addr.postalCode || addr.PostalCode || '',
        addressCode: addr.addressCode || addr.AddressCode || '',
        latitude: addr.latitude || addr.Latitude,
        longitude: addr.longitude || addr.Longitude,
        isDefault: Boolean(addr.isDefault ?? addr.IsDefault)
      }));
    } catch (e) {
      this.logger.error('UserApiService.getAddressesByUserId', e, { userId });
      return [];
    }
  }

  async register(payload: RegisterPayload): Promise<ApiResponse<unknown>> {
    return firstValueFrom(
      this.http.post<ApiResponse<unknown>>(`${this.BASE_URL}/customer/Users`, payload)
    );
  }

  async getUsers(): Promise<User[]> {
    const currentUser = getStoredSessionUser();
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      try {
        const envelope = await firstValueFrom(this.http.get<ApiResponse<UserResponseDto[]>>(`${this.BASE_URL}/admin/Users`));
        const list = envelope?.data || [];
        return list.map((u): User => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
          email: u.email || '',
          role: this.authApi.normalizeRole(u.role),
          phone: u.phone || '',
          avatar: u.avatar || '',
          joinedAt: u.createdAt ?? '',
          addresses: []
        }));
      } catch (e) {
        this.logger.error('UserApiService.getUsers', e);
        return [];
      }
    } else {
      const user = await this.getUserById(currentUser.id);
      return user ? [user] : [];
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const currentUser = getStoredSessionUser();
      const profileKey = currentUser?.name ? currentUser.name : id;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<UserResponseDto>>(`${this.BASE_URL}/customer/Users/${encodeURIComponent(profileKey)}/profile`));
      const userRes = envelope?.data;
      if (!userRes) return undefined;
      const addresses = await this.getAddressesByUserId(userRes.id);
      return {
        id: userRes.id,
        name: `${userRes.firstName || ''} ${userRes.lastName || ''}`.trim() || 'User',
        email: userRes.email || '',
        role: this.authApi.normalizeRole(userRes.role),
        phone: userRes.phone || '',
        avatar: userRes.avatar || '',
        joinedAt: userRes.createdAt ?? '',
        addresses: addresses
      };
    } catch (e) {
      this.logger.error('UserApiService.getUserById', e, { id });
      return undefined;
    }
  }

  async saveUser(user: User, avatarFile?: File): Promise<User> {
    const nameParts = (user.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      // Ambil ID dari customer service yang disimpan oleh profile.component.ts
      const externalProfileId = localStorage.getItem('externalProfileId');
      const targetProfileId = externalProfileId || user.id;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('FirstName', firstName);
        formData.append('LastName', lastName);
        formData.append('Avatar', avatarFile);

        await firstValueFrom(this.http.put<ApiResponse<unknown>>(`${this.BASE_URL}/customer/Users/${targetProfileId}/profile/with-files`, formData));
      } else {
        const profileBody = {
          firstName: firstName,
          lastName: lastName,
          avatar: user.avatar || ''
        };

        await firstValueFrom(this.http.put<ApiResponse<unknown>>(`${this.BASE_URL}/customer/Users/${targetProfileId}/profile`, profileBody));
      }

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
          addressCode: addr.addressCode || '',
          latitude: addr.latitude || 0,
          longitude: addr.longitude || 0,
          isDefault: addr.isDefault
        };

        if (isNew) {
          await firstValueFrom(this.http.post<ApiResponse<unknown>>(`${this.BASE_URL}/customer/Addresses`, addressBody));
        } else {
          await firstValueFrom(this.http.put<ApiResponse<unknown>>(`${this.BASE_URL}/customer/Addresses/${addr.id}`, addressBody));
          backendAddrMap.delete(addr.id);
        }
      }

      for (const id of backendAddrMap.keys()) {
        try {
          await firstValueFrom(this.http.delete(`${this.BASE_URL}/customer/Addresses/${id}`));
        } catch (e) {
          this.logger.error('UserApiService.saveUser.deleteAddress', e, { id });
        }
      }

      const updatedAddresses = await this.getAddressesByUserId(user.id);

      return {
        ...user,
        addresses: updatedAddresses
      };
    } catch (e) {
      this.logger.error('UserApiService.saveUser', e);
      throw e;
    }
  }

  private buildAddressPayload(userId: string, userName: string, addr: Address) {
    return {
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
      addressCode: addr.addressCode || '',
      latitude: addr.latitude || 0,
      longitude: addr.longitude || 0,
      isDefault: addr.isDefault
    };
  }

  async addAddress(userId: string, userName: string, addr: Address): Promise<boolean> {
    const addressBody = this.buildAddressPayload(userId, userName, addr);
    try {
      await firstValueFrom(this.http.post<ApiResponse<unknown>>(`${this.BASE_URL}/customer/Addresses`, addressBody));
      return true;
    } catch (e) {
      this.logger.error('UserApiService.addAddress', e);
      return false;
    }
  }

  async updateAddress(userId: string, userName: string, addr: Address): Promise<boolean> {
    const addressBody = this.buildAddressPayload(userId, userName, addr);
    try {
      await firstValueFrom(this.http.put<ApiResponse<unknown>>(`${this.BASE_URL}/customer/Addresses/${addr.id}`, addressBody));
      return true;
    } catch (e) {
      this.logger.error('UserApiService.updateAddress', e);
      return false;
    }
  }

  async deleteAddress(addressId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/customer/Addresses/${addressId}`));
      return true;
    } catch (e) {
      this.logger.error('UserApiService.deleteAddress', e);
      return false;
    }
  }

  async changePassword(userId: string, password: string, confirmPassword: string): Promise<boolean> {
    const userPwdUrl = (environment as unknown as { userPasswordApiUrl?: string }).userPasswordApiUrl;
    const url = userPwdUrl ? `${userPwdUrl}/change-password` : `${this.BASE_URL}/customer/Users/ChangePassword`;
    try {
      await firstValueFrom(
        this.http.post(url, {
          userId,
          password,
          confirmPassword
        })
      );
      return true;
    } catch (e) {
      this.logger.error('UserApiService.changePassword', e);
      return false;
    }
  }
}
