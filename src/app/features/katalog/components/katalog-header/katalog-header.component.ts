import { Component, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { KatalogCartStore } from '../../../../store/katalog-cart.store';

@Component({
  selector: 'app-katalog-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './katalog-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KatalogHeaderComponent {
  router = inject(Router);
  cartStore = inject(KatalogCartStore);
  private destroyRef = inject(DestroyRef);

  pageTitle = signal('');
  currentUrl = signal('');

  constructor() {
    this.updateTitle();

    this.router.events.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.updateTitle();
    });
  }

  updateTitle() {
    const url = this.router.url.split('?')[0];
    this.currentUrl.set(url);
    if (url.includes('/cart')) this.pageTitle.set('Keranjang Saya');
    else if (url.includes('/checkout')) this.pageTitle.set('Checkout');
    else if (url.includes('/search')) this.pageTitle.set('Cari Produk');
    else if (url.includes('/product')) this.pageTitle.set('Detail Produk');
    else this.pageTitle.set('Kembali');
  }

  goBack() {
    this.router.navigate(['/katalog']);
  }
}
