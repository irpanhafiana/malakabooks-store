import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductStore } from '../../../store/product.store';
import { Product, Category } from '../../../core/models';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { TextareaComponent } from '../../../shared/ui/textarea/textarea.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-products-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableComponent, ModalComponent, InputComponent, SelectComponent, TextareaComponent, ButtonComponent, BadgeComponent, PriceComponent, IconComponent],
  template: `
    <div class="animate-fade-in flex flex-col gap-6">
      
      <!-- Top Action bar -->
      <div class="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
        <div class="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search products..."
            [value]="searchQuery()"
            (input)="onSearchInput($any($event.target).value)"
            class="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl py-2 px-3 pl-10 text-xs focus:outline-none focus:border-primary-500 transition-all"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <app-icon name="search" size="14"></app-icon>
          </div>
        </div>

        <app-button (click)="openAddModal()" variant="primary" size="sm">
          <app-icon name="plus" size="14"></app-icon>
          Add Product
        </app-button>
      </div>

      <!-- Data Table -->
      @if (productStore.loading()) {
        <div class="p-8 text-center text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100 shadow-xs">Loading products list...</div>
      } @else {
        <app-table>
          <tr table-headers>
            <th class="px-5 py-3">Product</th>
            <th class="px-5 py-3">Category</th>
            <th class="px-5 py-3">Price</th>
            <th class="px-5 py-3">Stock</th>
            <th class="px-5 py-3">Rating</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>

          <ng-container table-rows>
            @for (prod of filteredList(); track prod.id) {
              <tr class="hover:bg-slate-50/30">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-8 bg-slate-50 rounded overflow-hidden flex-shrink-0 border border-slate-100">
                      <img [src]="prod.images[0]" class="h-full w-full object-cover" />
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-slate-800 text-xs line-clamp-1">{{ prod.name }}</span>
                      <span class="text-[10px] text-slate-400">{{ prod.brand }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 text-xs font-semibold text-slate-600">{{ prod.categoryName }}</td>
                <td class="px-5 py-4">
                  <app-price [value]="prod.price" size="sm"></app-price>
                </td>
                <td class="px-5 py-4">
                  <app-badge [variant]="prod.stock > 10 ? 'success' : prod.stock > 0 ? 'warning' : 'danger'">
                    {{ prod.stock }} left
                  </app-badge>
                </td>
                <td class="px-5 py-4 text-xs font-semibold text-slate-700">⭐ {{ prod.rating }}</td>
                <td class="px-5 py-4 text-right">
                  <div class="flex justify-end gap-1.5">
                    <button (click)="openEditModal(prod)" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
                      <app-icon name="edit" size="14"></app-icon>
                    </button>
                    <button (click)="onDelete(prod.id)" class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
                      <app-icon name="trash" size="14"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="p-8 text-center text-slate-400">No products found.</td>
              </tr>
            }
          </ng-container>
        </app-table>
      }

      <!-- Add/Edit Product Modal Form -->
      <app-modal [isOpen]="isModalOpen()" [title]="editProduct() ? 'Edit Product' : 'Add New Product'" [hasFooter]="true">
        <form [formGroup]="productForm" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <app-input label="Product Name" placeholder="e.g. The Midnight Library" [control]="nameControl"></app-input>
          </div>
          
          <app-select label="Category" placeholder="Select category" [options]="categoryOptions()" [control]="categoryControl"></app-select>
          <app-input label="Brand" placeholder="e.g. Canongate Books" [control]="brandControl"></app-input>

          <app-input label="Author" placeholder="e.g. Matt Haig" [control]="authorControl"></app-input>
          <app-input label="ISBN" placeholder="e.g. 978-0525559474" [control]="isbnControl"></app-input>

          <app-input label="Published Year" placeholder="e.g. 2020" type="number" [control]="publishedYearControl"></app-input>
          <app-input label="Pages" placeholder="e.g. 304" type="number" [control]="pagesControl"></app-input>

          <app-input label="Weight (kg)" placeholder="e.g. 0.35" type="number" [control]="weightControl"></app-input>

          <app-input label="Price" placeholder="e.g. 14.99" type="number" [control]="priceControl"></app-input>
          <app-input label="Original Price (Optional)" placeholder="e.g. 19.99" type="number" [control]="origPriceControl"></app-input>

          <app-input label="Stock Inventory" placeholder="e.g. 50" type="number" [control]="stockControl"></app-input>
          <app-input label="Primary Image URL" placeholder="https://images.unsplash.com/..." [control]="imageControl"></app-input>
          
          <div class="sm:col-span-2">
            <app-textarea label="Description" placeholder="Write comprehensive product description..." [control]="descControl" [rows]="3"></app-textarea>
          </div>
        </form>

        <ng-container modal-footer>
          <app-button (click)="closeModal()" variant="outline" size="sm">Cancel</app-button>
          <app-button (click)="onSubmitForm()" [disabled]="productForm.invalid" variant="primary" size="sm">Save Product</app-button>
        </ng-container>
      </app-modal>

    </div>
  `
})
export class ProductsCrudComponent implements OnInit {
  protected readonly productStore = inject(ProductStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');
  isModalOpen = signal<boolean>(false);
  editProduct = signal<Product | null>(null);

  // Form Controls
  nameControl = new FormControl('', [Validators.required]);
  categoryControl = new FormControl('', [Validators.required]);
  brandControl = new FormControl('', [Validators.required]);
  priceControl = new FormControl<number>(0, [Validators.required, Validators.min(0.01)]);
  origPriceControl = new FormControl<number | null>(null);
  stockControl = new FormControl<number>(0, [Validators.required, Validators.min(0)]);
  imageControl = new FormControl('', [Validators.required]);
  descControl = new FormControl('', [Validators.required]);
  authorControl = new FormControl('', [Validators.required]);
  isbnControl = new FormControl('', [Validators.required]);
  publishedYearControl = new FormControl<number>(new Date().getFullYear(), [Validators.required, Validators.min(1800), Validators.max(new Date().getFullYear() + 1)]);
  pagesControl = new FormControl<number>(1, [Validators.required, Validators.min(1)]);
  weightControl = new FormControl<number>(0.1, [Validators.required, Validators.min(0)]);

  productForm = new FormGroup({
    name: this.nameControl,
    category: this.categoryControl,
    brand: this.brandControl,
    price: this.priceControl,
    originalPrice: this.origPriceControl,
    stock: this.stockControl,
    image: this.imageControl,
    description: this.descControl,
    author: this.authorControl,
    isbn: this.isbnControl,
    publishedYear: this.publishedYearControl,
    pages: this.pagesControl,
    weight: this.weightControl
  });

  categoryOptions = computed(() => {
    return this.productStore.categories().map(c => ({ value: c.id, label: c.name }));
  });

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.productStore.products();
    if (!query) return list;
    return list.filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query));
  });

  ngOnInit() {
    this.productStore.loadAll();
  }

  onSearchInput(val: string) {
    this.searchQuery.set(val);
  }

  openAddModal() {
    this.editProduct.set(null);
    this.productForm.reset();
    this.priceControl.setValue(0);
    this.stockControl.setValue(0);
    this.publishedYearControl.setValue(new Date().getFullYear());
    this.pagesControl.setValue(1);
    this.weightControl.setValue(0.1);
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product) {
    this.editProduct.set(product);
    this.nameControl.setValue(product.name);
    this.categoryControl.setValue(product.categoryId);
    this.brandControl.setValue(product.brand);
    this.priceControl.setValue(product.price);
    this.origPriceControl.setValue(product.originalPrice || null);
    this.stockControl.setValue(product.stock);
    this.imageControl.setValue(product.images[0]);
    this.descControl.setValue(product.description);
    this.authorControl.setValue(product.specifications['Author'] || '');
    this.isbnControl.setValue(product.specifications['ISBN'] || '');
    const pubYear = parseInt(product.specifications['Published Year']) || new Date().getFullYear();
    this.publishedYearControl.setValue(pubYear);
    const pgs = parseInt(product.specifications['Pages']) || 1;
    this.pagesControl.setValue(pgs);
    const wgt = parseFloat(product.specifications['Weight']) || 0.1;
    this.weightControl.setValue(wgt);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onSubmitForm() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Produk?',
      'Apakah Anda yakin ingin menyimpan perubahan data produk ini?'
    );
    if (!isConfirmed) return;

    const catId = this.categoryControl.value || '';
    const catName = this.productStore.categories().find(c => c.id === catId)?.name || 'Other';

    const pData: Product = {
      id: this.editProduct()?.id || '',
      name: this.nameControl.value || '',
      description: this.descControl.value || '',
      price: this.priceControl.value || 0,
      originalPrice: this.origPriceControl.value || undefined,
      images: [this.imageControl.value || ''],
      categoryId: catId,
      categoryName: catName,
      stock: this.stockControl.value || 0,
      rating: this.editProduct()?.rating || 5.0,
      reviewsCount: this.editProduct()?.reviewsCount || 0,
      featured: this.editProduct()?.featured || false,
      brand: this.brandControl.value || '',
      specifications: {
        'Author': this.authorControl.value || '',
        'ISBN': this.isbnControl.value || '',
        'Published Year': (this.publishedYearControl.value || new Date().getFullYear()).toString(),
        'Pages': (this.pagesControl.value || 1).toString(),
        'Weight': (this.weightControl.value || 0.1).toString(),
        'Language': this.editProduct()?.specifications['Language'] || 'English',
        'Format': this.editProduct()?.specifications['Format'] || 'Hardcover'
      },
      createdAt: this.editProduct()?.createdAt || new Date().toISOString()
    };

    await this.productStore.saveProduct(pData);
    this.closeModal();
    this.alertService.success('Berhasil!', 'Data produk berhasil disimpan.');
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Produk?',
      'Produk ini akan dihapus secara permanen dari katalog.'
    );
    if (isConfirmed) {
      await this.productStore.deleteProduct(id);
      this.alertService.success('Berhasil!', 'Produk telah berhasil dihapus.');
    }
  }
}
