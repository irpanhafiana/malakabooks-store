import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-katalog-product-card',
  standalone: true,
  imports: [CurrencyPipe, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './katalog-product-card.component.html'
})
export class KatalogProductCardComponent {
  product = input.required<Product>();
  priority = input<boolean>(false);
  clickCard = output<Product>();
}
