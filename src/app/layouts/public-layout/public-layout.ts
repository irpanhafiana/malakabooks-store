import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ViewportService } from '../../core/services/viewport.service';

import { BottomNavigationComponent } from '../../shared/components/bottom-navigation/bottom-navigation';
import { HeaderComponent } from '../../shared/components/header/header';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, FormsModule, BottomNavigationComponent, HeaderComponent],
  templateUrl: './public-layout.html'
})
export class PublicLayout {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  protected readonly viewport = inject(ViewportService);

  private readonly router = inject(Router);

  // Signals/Properties
  searchQuery = '';
  isMobileMenuOpen = false;
  isUserDropdownOpen = false;
  currentUrl = signal(this.router.url);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly currentUser = this.authService.currentUser;
  readonly cartItemsCount = this.cartService.totalItemsCount;

  readonly isBookDetailPage = computed(() => this.currentUrl().startsWith('/book/'));

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentUrl.set(event.urlAfterRedirects);
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleUserDropdown() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  onSearchSubmit() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/catalog'], { queryParams: { q: this.searchQuery.trim() } });
      this.searchQuery = '';
    }
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.isUserDropdownOpen = false;
      this.router.navigate(['/']);
    });
  }
}
