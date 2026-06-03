import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bottom-navigation.html'
})
export class BottomNavigationComponent {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly cartItemsCount = this.cartService.totalItemsCount;
  readonly currentUser = this.authService.currentUser;
}
