import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderDetailPage } from './order-detail';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-order-detail-desktop',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyRupiahPipe, LoadingSpinnerComponent],
  templateUrl: './order-detail-desktop.html'
})
export class OrderDetailDesktopComponent {
  parent = input.required<OrderDetailPage>();
}
