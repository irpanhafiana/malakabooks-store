import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartPage } from './cart';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { ButtonComponent } from '../../../shared/components/button/button';

@Component({
  selector: 'app-cart-desktop',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyRupiahPipe, EmptyStateComponent, ButtonComponent],
  templateUrl: './cart-desktop.html'
})
export class CartDesktopComponent {
  parent = input.required<CartPage>();
}
