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
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../core/services/alert.service';
import { createClientPagination } from '../../../shared/util/pagination.util';

@Component({
  selector: 'app-products-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableComponent, ModalComponent, InputComponent, SelectComponent, TextareaComponent, ButtonComponent, BadgeComponent, PriceComponent, IconComponent, PaginationComponent],
  templateUrl: './products-crud.component.html',
  styleUrl: './products-crud.component.css'
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

  // Client-side pagination over the filtered list (auto-clamps on filter/delete).
  protected readonly pagination = createClientPagination(this.filteredList, 10);

  ngOnInit() {
    this.productStore.loadAll();
  }

  onSearchInput(val: string) {
    this.searchQuery.set(val);
    this.pagination.setPage(1);
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
