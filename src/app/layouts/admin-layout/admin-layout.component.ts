import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthStore } from '../../store/auth.store';
import { IconComponent } from '../../shared/ui/icon/icon.component';

import { OrderStore } from '../../store/order.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  protected readonly router = inject(Router);

  isSidebarOpen = signal<boolean>(false);
  activeRouteName = signal<string>('Dashboard');
  pageDescription = signal<string>('Ringkasan statistik toko dan laporan utama');
  currentUrl = signal<string>('');
  isMasterDataOpen = signal<boolean>(false);
  isMardikaKopiOpen = signal<boolean>(false);

  unshippedOrdersCount = computed(() => {
    return this.orderStore.orders().filter(o => !o.trackingNumber && o.status !== 'cancelled').length;
  });
  constructor() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        const url = this.router.url;
        const isMasterRoute = url.includes('/categories') ||
          url.includes('/promotion-banners') ||
          url.includes('/authors') ||
          url.includes('/users');
        if (isMasterRoute) {
          this.isMasterDataOpen.set(true);
        }

        const isMardikaRoute = url.includes('/uoms') ||
          url.includes('/warehouses') ||
          url.includes('/items') ||
          url.includes('/stocks') ||
          url.includes('/pricings') ||
          url.includes('/inventory-movements');
        if (isMardikaRoute) {
          this.isMardikaKopiOpen.set(true);
        }

        if (url.includes('/categories')) {
          this.activeRouteName.set('Kelola Kategori');
          this.pageDescription.set('Manajemen kategori kopi dan produk');
        } else if (url.includes('/uoms')) {
          this.activeRouteName.set('Kelola Satuan Ukuran (UoM)');
          this.pageDescription.set('Manajemen satuan ukur produk');
        } else if (url.includes('/warehouses')) {
          this.activeRouteName.set('Kelola Gudang');
          this.pageDescription.set('Manajemen lokasi gudang penyimpanan');
        } else if (url.includes('/items')) {
          this.activeRouteName.set('Kelola Produk');
          this.pageDescription.set('Manajemen katalog produk dan kopi');
        } else if (url.includes('/stocks')) {
          this.activeRouteName.set('Kelola Stok Gudang');
          this.pageDescription.set('Manajemen ketersediaan stok di gudang');
        } else if (url.includes('/pricings')) {
          this.activeRouteName.set('Kelola Harga');
          this.pageDescription.set('Manajemen harga dasar dan jual produk');
        } else if (url.includes('/inventory-movements')) {
          this.activeRouteName.set('Riwayat Mutasi Stok');
          this.pageDescription.set('Laporan pergerakan stok barang');
        } else if (url.includes('/payment-methods')) {
          this.activeRouteName.set('Kelola Metode Pembayaran');
          this.pageDescription.set('Manajemen opsi pembayaran pelanggan');
        } else if (url.includes('/authors')) {
          this.activeRouteName.set('Kelola Penulis');
          this.pageDescription.set('Manajemen data penulis (opsional)');
        } else if (url.includes('/orders')) {
          this.activeRouteName.set('Kelola Pesanan');
          this.pageDescription.set('Manajemen transaksi dan pesanan pelanggan');
        } else if (url.includes('/users')) {
          this.activeRouteName.set('Kelola Pengguna');
          this.pageDescription.set('Manajemen data akun pelanggan');
        } else if (url.includes('/reports')) {
          this.activeRouteName.set('Laporan Analitik');
          this.pageDescription.set('Buat dan unduh laporan CSV terstruktur dari log database e-commerce Anda');
        } else if (url.includes('/home-addresses')) {
          this.activeRouteName.set('Kelola Alamat Pengiriman');
          this.pageDescription.set('Manajemen alamat pengiriman pelanggan');
        } else if (url.includes('/promotion-banners')) {
          this.activeRouteName.set('Kelola Banner Promosi');
          this.pageDescription.set('Manajemen banner promosi dan diskon');
        } else if (url.includes('/complaints')) {
          this.activeRouteName.set('Kelola Komplain');
          this.pageDescription.set('Manajemen komplain dan keluhan pelanggan');
        } else {
          this.activeRouteName.set('Ringkasan Dashboard');
          this.pageDescription.set('Ringkasan statistik toko dan laporan utama');
        }
        
        this.currentUrl.set(window.location.origin + url);
      });

    this.orderStore.loadAllOrders();
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  toggleMasterData() {
    this.isMasterDataOpen.update(v => !v);
  }

  toggleMardikaKopi() {
    this.isMardikaKopiOpen.update(v => !v);
  }

  onSignOut() {
    this.authStore.logout();
  }
}
