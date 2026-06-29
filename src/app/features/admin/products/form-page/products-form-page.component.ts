import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductStore } from '../../../../store/product.store';
import { Product } from '../../../../core/models';
import { ProductsFormComponent } from '../form/products-form.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-products-form-page',
  standalone: true,
  imports: [ProductsFormComponent, IconComponent, AdminButtonComponent],
  templateUrl: './products-form-page.component.html',
  styleUrl: './products-form-page.component.css'
})
export class ProductsFormPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productStore = inject(ProductStore);

  protected readonly editProduct = signal<Product | null>(null);
  protected readonly isEditing = signal(false);

  ngOnInit() {
    this.productStore.loadAll();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      // Wait for products to load, then find the product by ID
      // If store is already loaded, we can find it immediately
      const product = this.productStore.products().find(p => p.id === id);
      if (product) {
        this.editProduct.set(product);
      } else {
        // Simple watcher to wait for store loading if not immediate
        const checkInterval = setInterval(() => {
          const loadedProduct = this.productStore.products().find(p => p.id === id);
          if (loadedProduct) {
            this.editProduct.set(loadedProduct);
            clearInterval(checkInterval);
          }
        }, 100);

        // Fallback timeout to stop checking
        setTimeout(() => clearInterval(checkInterval), 3000);
      }
    } else {
      this.isEditing.set(false);
      this.editProduct.set(null);
    }
  }

  onCancel() {
    this.router.navigate(['/admin/products']);
  }

  onSave() {
    this.router.navigate(['/admin/products']);
  }
}
