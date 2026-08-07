import { Component, signal, inject, OnInit, AfterViewInit, viewChild, ElementRef, ChangeDetectionStrategy, computed } from '@angular/core';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { ProductStore } from '../../../store/product.store';
import { KatalogCartStore } from '../../../store/katalog-cart.store';
import { KatalogSelectionSheetComponent } from '../components/katalog-selection-sheet/katalog-selection-sheet.component';

@Component({
  selector: 'app-katalog-search',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    RouterModule,
    KatalogSelectionSheetComponent,
    NgOptimizedImage
  ],
  templateUrl: './katalog-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KatalogSearchComponent implements OnInit, AfterViewInit {
  private productStore = inject(ProductStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  cartStore = inject(KatalogCartStore);

  searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  searchQuery = signal<string>('');
  selectedProductForSheet = signal<Product | null>(null);

  products = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query || query.length < 2) return [];
    return this.productStore.products().filter(p =>
      p.title.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(query))
    );
  });

  ngOnInit() {
    this.productStore.loadAll();
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.searchQuery.set(q);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.searchInput().nativeElement.focus();
    }, 100);
  }

  goBack() {
    this.router.navigate(['/katalog']);
  }
}
