import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, Router, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ViewportService } from '../../core/services/viewport.service';

import { BottomNavigationComponent } from '../../shared/components/bottom-navigation/bottom-navigation';
import { HeaderComponent } from '../../shared/components/header/header';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, BottomNavigationComponent, HeaderComponent],
  templateUrl: './customer-layout.html'
})
export class CustomerLayout {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  protected readonly viewport = inject(ViewportService);

  private readonly router = inject(Router);

  isMobileSidebarOpen = false;
  currentUrl = signal(this.router.url);

  readonly currentUser = this.authService.currentUser;
  readonly cartItemsCount = this.cartService.totalItemsCount;

  readonly isCartPage = computed(() => this.currentUrl() === '/account/cart');

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentUrl.set(event.urlAfterRedirects);
    });
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
