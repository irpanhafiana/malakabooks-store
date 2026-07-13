import { Component, inject, OnInit, signal, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ItemStore } from '../../../../store/item.store';
import { ProductStore } from '../../../../store/product.store';
import { CatalogItem, Product } from '../../../../core/models';
import { ProductsFormComponent } from '../../products/form/products-form.component';
import { ItemsFormComponent } from '../form/items-form.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-items-form-page',
  standalone: true,
  imports: [ItemsFormComponent, IconComponent, AdminButtonComponent, ProductsFormComponent],
  templateUrl: './items-form-page.component.html'
})
export class ItemsFormPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly itemStore = inject(ItemStore);
  private readonly productStore = inject(ProductStore);

  @ViewChild(ItemsFormComponent) itemsForm!: ItemsFormComponent;
  @ViewChild(ProductsFormComponent) productsForm!: ProductsFormComponent;

  protected readonly editItem = signal<CatalogItem | null>(null);
  protected readonly isEditing = signal(false);
  protected selectedItemType = signal<string>('mardika');

  ngOnInit() {
    this.itemStore.loadItems();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      
      const item = this.itemStore.items()?.find((p: CatalogItem) => p.id === id);
      if (item) {
        this.editItem.set(item);
      } else {
        const checkInterval = setInterval(() => {
          const loadedItem = this.itemStore.items()?.find((p: CatalogItem) => p.id === id);
          if (loadedItem) {
            this.editItem.set(loadedItem);
            clearInterval(checkInterval);
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 3000);
      }
    } else {
      this.isEditing.set(false);
      this.editItem.set(null);
    }
  }

  onCancel() {
    this.router.navigate(['/admin/items']);
  }

  onSave() {
    this.router.navigate(['/admin/items']);
  }

  async saveCombined() {
    if (this.itemsForm.formGroup.invalid || this.productsForm.productForm.invalid) {
      return;
    }

    try {
      // 1. Post to Items
      const itemPayload = this.itemsForm.getPayload(); // I will need to expose this method on ItemsFormComponent or construct it here
      const savedItem = await this.itemStore.saveItem(itemPayload);

      if (savedItem && savedItem.id) {
        // 2. Post to Books
        const bookPayload = this.productsForm.getPayload(); // I will need to expose this method on ProductsFormComponent
        const pData: Product = {
          ...bookPayload,
          sapCode: bookPayload.sapCode || itemPayload.sapCode || '', // fallback to item SAP code if disabled
          itemId: savedItem.id
        };
        await this.productStore.saveProduct(pData);
        this.router.navigate(['/admin/items']);
      }
    } catch (e) {
      console.error('Failed combined save', e);
    }
  }

  onItemTypeChange(type: string) {
    this.selectedItemType.set(type);
  }
}
