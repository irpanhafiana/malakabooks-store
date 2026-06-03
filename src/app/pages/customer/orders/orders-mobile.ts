import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersPage } from './orders';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { BadgeComponent } from '../../../shared/components/badge/badge';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-orders-mobile',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyRupiahPipe, LoadingSpinnerComponent, BadgeComponent, EmptyStateComponent],
  templateUrl: './orders-mobile.html'
})
export class OrdersMobileComponent {
  parent = input.required<OrdersPage>();
}
