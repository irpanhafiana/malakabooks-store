import { Component, inject, input, output, effect, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductStore } from '../../../../store/product.store';
import { Product } from '../../../../core/models';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { TextareaComponent } from '../../../../shared/ui/textarea/textarea.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-products-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, SelectComponent, TextareaComponent, ButtonComponent],
  templateUrl: './products-form.component.html',
  styleUrl: './products-form.component.css'
})
export class ProductsFormComponent {
  product = input<Product | null>(null);
  onCancel = output<void>();
  onSave = output<void>();

  private readonly productStore = inject(ProductStore);
  private readonly alertService = inject(AlertService);

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

  constructor() {
    effect(() => {
      const prod = this.product();
      if (prod) {
        this.nameControl.setValue(prod.name);
        this.categoryControl.setValue(prod.categoryId);
        this.brandControl.setValue(prod.brand);
        this.priceControl.setValue(prod.price);
        this.origPriceControl.setValue(prod.originalPrice || null);
        this.stockControl.setValue(prod.stock);
        this.imageControl.setValue(prod.images[0]);
        this.descControl.setValue(prod.description);
        this.authorControl.setValue(prod.specifications?.['Author'] || '');
        this.isbnControl.setValue(prod.specifications?.['ISBN'] || '');
        const pubYear = parseInt(prod.specifications?.['Published Year'] || '') || new Date().getFullYear();
        this.publishedYearControl.setValue(pubYear);
        const pgs = parseInt(prod.specifications?.['Pages'] || '') || 1;
        this.pagesControl.setValue(pgs);
        const wgt = parseFloat(prod.specifications?.['Weight'] || '') || 0.1;
        this.weightControl.setValue(wgt);
      } else {
        this.productForm.reset();
        this.priceControl.setValue(0);
        this.stockControl.setValue(0);
        this.publishedYearControl.setValue(new Date().getFullYear());
        this.pagesControl.setValue(1);
        this.weightControl.setValue(0.1);
      }
    });
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
      id: this.product()?.id || '',
      name: this.nameControl.value || '',
      description: this.descControl.value || '',
      price: this.priceControl.value || 0,
      originalPrice: this.origPriceControl.value || undefined,
      images: [this.imageControl.value || ''],
      categoryId: catId,
      categoryName: catName,
      stock: this.stockControl.value || 0,
      rating: this.product()?.rating || 5.0,
      reviewsCount: this.product()?.reviewsCount || 0,
      featured: this.product()?.featured || false,
      brand: this.brandControl.value || '',
      specifications: {
        'Author': this.authorControl.value || '',
        'ISBN': this.isbnControl.value || '',
        'Published Year': (this.publishedYearControl.value || new Date().getFullYear()).toString(),
        'Pages': (this.pagesControl.value || 1).toString(),
        'Weight': (this.weightControl.value || 0.1).toString(),
        'Language': this.product()?.specifications?.['Language'] || 'English',
        'Format': this.product()?.specifications?.['Format'] || 'Hardcover'
      },
      createdAt: this.product()?.createdAt || new Date().toISOString()
    };

    await this.productStore.saveProduct(pData);
    this.alertService.success('Berhasil!', 'Data produk berhasil disimpan.');
    this.onSave.emit();
  }
}
