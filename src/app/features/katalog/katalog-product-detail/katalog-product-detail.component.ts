import { Component, inject, signal, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, Location, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { switchMap, of, tap } from 'rxjs';
import { KatalogCartStore } from '../../../store/katalog-cart.store';
import { ProductApiService } from '../../../core/services/product-api.service';
import { KatalogQuantitySelectorComponent } from '../components/katalog-quantity-selector/katalog-quantity-selector.component';

@Component({
  selector: 'app-katalog-product-detail',
  standalone: true,
  imports: [CurrencyPipe, NgOptimizedImage, KatalogQuantitySelectorComponent],
  templateUrl: './katalog-product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KatalogProductDetailComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private cartStore = inject(KatalogCartStore);
  private productApi = inject(ProductApiService);

  isLoading = signal<boolean>(false);

  product = toSignal(
    this.route.paramMap.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.isLoading.set(false);
          return of(undefined);
        }
        return this.productApi.getProductById(id).then(p => {
          this.isLoading.set(false);
          return p;
        }).catch(err => {
          console.error('Fetch product error:', err);
          this.isLoading.set(false);
          return undefined;
        });
      })
    ),
    { initialValue: undefined }
  );

  quantity = signal<number>(1);
  selectedUom = signal<string>('');

  uomOptions = signal<string[]>([]);

  constructor() {
    effect(() => {
      const p = this.product();
      if (p) {
        untracked(() => {
          let opts: string[] = [];
          if (p.uomGroup && p.uomGroup.details && p.uomGroup.details.length > 0) {
            opts = p.uomGroup.details.map(d => d.code);
          } else {
            opts = [p.salesUomCode || p.baseUomCode || 'PCS'];
          }
          this.uomOptions.set(opts);
          this.selectedUom.set(opts[0] || 'PCS');
          this.quantity.set(1);
        });
      }
    });
  }

  addToCart() {
    const p = this.product();
    if (p) {
      this.cartStore.addToCart(p, this.quantity(), this.selectedUom());
      this.location.back();
    }
  }

  goBack() {
    this.location.back();
  }
}
