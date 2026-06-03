import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Address } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly ADDRESS_KEY = 'malaka_addresses';

  private addresses = signal<Address[]>([]);

  private defaultAddresses: Address[] = [
    {
      id: 'addr-1',
      userId: 'user-1',
      label: 'Rumah Utama',
      recipientName: 'Budi Santoso',
      phone: '081234567890',
      street: 'Jl. Merdeka No. 45, Kecamatan Senen',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10410',
      isDefault: true
    },
    {
      id: 'addr-2',
      userId: 'user-1',
      label: 'Kantor Budi',
      recipientName: 'Budi Santoso (Merdeka Corp)',
      phone: '081234567890',
      street: 'Gedung Wisma Mulia Lt. 15, Jl. Gatot Subroto No. 42',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12710',
      isDefault: false
    },
    {
      id: 'addr-3',
      userId: 'user-2',
      label: 'Rumah Siti',
      recipientName: 'Siti Rahma',
      phone: '082134567890',
      street: 'Gang Kelinci III No. 8B, Kelurahan Braga',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40111',
      isDefault: true
    },
    {
      id: 'addr-4',
      userId: 'user-2',
      label: 'Kost Kakak',
      recipientName: 'Siti Rahma (c/o Rina)',
      phone: '082199998888',
      street: 'Jl. Sukajadi No. 102',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40162',
      isDefault: false
    },
    {
      id: 'addr-5',
      userId: 'user-4',
      label: 'Rumah Faisal',
      recipientName: 'Ahmad Faisal',
      phone: '087712345678',
      street: 'Jl. Pemuda No. 12, Kelurahan Sekayu',
      city: 'Semarang',
      province: 'Jawa Barat',
      postalCode: '50132',
      isDefault: true
    },
    {
      id: 'addr-6',
      userId: 'user-5',
      label: 'Apartemen Dewi',
      recipientName: 'Dewi Lestari',
      phone: '081398765432',
      street: 'Apartemen Beverly Hills Tower A Lt. 8, Jl. Raya Darmo',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60241',
      isDefault: true
    },
    {
      id: 'addr-7',
      userId: 'user-5',
      label: 'Kantor Cabang',
      recipientName: 'Dewi Lestari (Gudang Buku)',
      phone: '081398765432',
      street: 'Kawasan Industri Rungkut Blok D-5',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60293',
      isDefault: false
    }
  ];

  constructor() {
    this.initAddresses();
  }

  private initAddresses() {
    const stored = localStorage.getItem(this.ADDRESS_KEY);
    if (stored) {
      this.addresses.set(JSON.parse(stored));
    } else {
      this.addresses.set(this.defaultAddresses);
      localStorage.setItem(this.ADDRESS_KEY, JSON.stringify(this.defaultAddresses));
    }
  }

  getByUser(userId: string): Observable<Address[]> {
    const list = this.addresses().filter((a) => a.userId === userId);
    return of(list).pipe(delay(200));
  }

  getById(id: string): Observable<Address | undefined> {
    const addr = this.addresses().find((a) => a.id === id);
    return of(addr).pipe(delay(150));
  }

  create(userId: string, addrData: Omit<Address, 'id' | 'userId'>): Observable<Address> {
    const newAddress: Address = {
      ...addrData,
      id: `addr-${Date.now()}`,
      userId,
      isDefault: this.addresses().filter((a) => a.userId === userId).length === 0 ? true : addrData.isDefault
    };

    let updated = [...this.addresses()];

    // If new address is set to default, unset other user's default addresses
    if (newAddress.isDefault) {
      updated = updated.map((a) => {
        if (a.userId === userId) {
          return { ...a, isDefault: false };
        }
        return a;
      });
    }

    updated.push(newAddress);
    this.addresses.set(updated);
    localStorage.setItem(this.ADDRESS_KEY, JSON.stringify(updated));

    return of(newAddress).pipe(delay(250));
  }

  update(id: string, addrData: Partial<Address>): Observable<Address> {
    const addrIndex = this.addresses().findIndex((a) => a.id === id);
    if (addrIndex === -1) {
      return throwError(() => new Error('Alamat tidak ditemukan.')).pipe(delay(150));
    }

    const current = this.addresses()[addrIndex];
    const userId = current.userId;

    const updatedAddress: Address = {
      ...current,
      ...addrData
    };

    let updatedList = [...this.addresses()];

    if (addrData.isDefault && !current.isDefault) {
      updatedList = updatedList.map((a) => {
        if (a.userId === userId) {
          return { ...a, isDefault: false };
        }
        return a;
      });
    }

    updatedList = updatedList.map((a) => (a.id === id ? updatedAddress : a));
    this.addresses.set(updatedList);
    localStorage.setItem(this.ADDRESS_KEY, JSON.stringify(updatedList));

    return of(updatedAddress).pipe(delay(200));
  }

  delete(id: string): Observable<boolean> {
    const current = this.addresses().find((a) => a.id === id);
    if (!current) {
      return throwError(() => new Error('Alamat tidak ditemukan.')).pipe(delay(150));
    }

    const userId = current.userId;
    const isDeletedDefault = current.isDefault;

    let filtered = this.addresses().filter((a) => a.id !== id);

    // If deleted address was default, set another address as default
    if (isDeletedDefault) {
      const remainingUserAddresses = filtered.filter((a) => a.userId === userId);
      if (remainingUserAddresses.length > 0) {
        filtered = filtered.map((a) => {
          if (a.id === remainingUserAddresses[0].id) {
            return { ...a, isDefault: true };
          }
          return a;
        });
      }
    }

    this.addresses.set(filtered);
    localStorage.setItem(this.ADDRESS_KEY, JSON.stringify(filtered));

    return of(true).pipe(delay(200));
  }

  setDefault(id: string, userId: string): Observable<Address> {
    return this.update(id, { isDefault: true });
  }
}
