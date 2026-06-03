import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './header.html'
})
export class HeaderComponent {
  @Input() title = '';
  @Input() showBackButton = false;
  @Input() mode: 'public' | 'customer' | 'admin' = 'public';

  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly currentUser = this.authService.currentUser;
  readonly cartItemsCount = this.cartService.totalItemsCount;

  searchQuery = '';
  isUserDropdownOpen = false;

  toggleUserDropdown() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
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
