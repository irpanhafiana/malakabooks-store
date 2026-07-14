import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthStore } from '../../store/auth.store';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ToastContainerComponent } from '../../shared/ui/toast-container/toast-container.component';
import { OrderStore } from '../../store/order.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ToastContainerComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  protected readonly router = inject(Router);

  isSidebarOpen = signal<boolean>(false);
  activeRouteName = signal<string>('Dashboard');
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
        } else if (url.includes('/uoms')) {
          this.activeRouteName.set('Kelola Satuan Ukuran (UoM)');
        } else if (url.includes('/warehouses')) {
          this.activeRouteName.set('Kelola Gudang');
        } else if (url.includes('/items')) {
          this.activeRouteName.set('Kelola Produk');
        } else if (url.includes('/stocks')) {
          this.activeRouteName.set('Kelola Stok Gudang');
        } else if (url.includes('/pricings')) {
          this.activeRouteName.set('Kelola Pricing Master');
        } else if (url.includes('/inventory-movements')) {
          this.activeRouteName.set('Riwayat Mutasi Stok');
        } else if (url.includes('/payment-methods')) {
          this.activeRouteName.set('Kelola Metode Pembayaran');
        } else if (url.includes('/authors')) {
          this.activeRouteName.set('Kelola Penulis');
        } else if (url.includes('/orders')) {
          this.activeRouteName.set('Kelola Pesanan');
        } else if (url.includes('/users')) {
          this.activeRouteName.set('Kelola Pengguna');
        } else if (url.includes('/reports')) {
          this.activeRouteName.set('Analytics Reports');
        } else if (url.includes('/home-addresses')) {
          this.activeRouteName.set('Home Addresses Manager');
        } else if (url.includes('/promotion-banners')) {
          this.activeRouteName.set('Promotion Banners Manager');
        } else {
          this.activeRouteName.set('Dashboard Overview');
        }
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
    this.router.navigate(['/']);
  }
}
