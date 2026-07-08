import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthStore } from '../../store/auth.store';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ToastContainerComponent } from '../../shared/ui/toast-container/toast-container.component';

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
  protected readonly router = inject(Router);

  isSidebarOpen = signal<boolean>(false);
  activeRouteName = signal<string>('Dashboard');
  isMasterDataOpen = signal<boolean>(false);

  constructor() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        const url = this.router.url;
        const isMasterRoute = url.includes('/products') || 
                              url.includes('/categories') || 
                              url.includes('/promotion-banners') || 
                              url.includes('/authors') || 
                              url.includes('/users');
        if (isMasterRoute) {
          this.isMasterDataOpen.set(true);
        }

        if (url.includes('/products')) {
          this.activeRouteName.set('Products Manager');
        } else if (url.includes('/categories')) {
          this.activeRouteName.set('Categories Manager');
        } else if (url.includes('/payment-methods')) {
          this.activeRouteName.set('Payment Methods Manager');
        } else if (url.includes('/authors')) {
          this.activeRouteName.set('Authors Manager');
        } else if (url.includes('/orders')) {
          this.activeRouteName.set('Orders Manager');
        } else if (url.includes('/users')) {
          this.activeRouteName.set('Users Manager');
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

  onSignOut() {
    this.authStore.logout();
    this.router.navigate(['/']);
  }
}
