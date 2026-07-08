import { Component, inject, input, output, effect, computed, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductStore } from '../../../../store/product.store';
import { AuthorStore } from '../../../../store/author.store';
import { Product, AdditionalImage } from '../../../../core/models';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { EditorComponent } from '../../../../shared/ui/editor/editor.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-products-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminSelectComponent, EditorComponent, AdminButtonComponent],
  templateUrl: './products-form.component.html',
  styleUrl: './products-form.component.css'
})
export class ProductsFormComponent {
  readonly product = input<Product | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  protected readonly productStore = inject(ProductStore);
  protected readonly authorStore = inject(AuthorStore);
  private readonly alertService = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  titleControl = new FormControl('', [Validators.required]);
  categoryControl = new FormControl('', [Validators.required]);
  publisherControl = new FormControl('');
  priceControl = new FormControl<number>(0, [Validators.required, Validators.min(0.01)]);
  stockControl = new FormControl<number>(0, [Validators.required, Validators.min(0)]);
  coverImageControl = new FormControl('');
  descControl = new FormControl('', [Validators.required]);
  authorControl = new FormControl<string[]>([], [Validators.required]);
  isbnControl = new FormControl('');
  sapCodeControl = new FormControl({ value: '', disabled: true });
  publishedYearControl = new FormControl<number>(new Date().getFullYear());
  pagesControl = new FormControl<number>(0);
  weightControl = new FormControl<number>(0);

  productForm = new FormGroup({
    title: this.titleControl,
    category: this.categoryControl,
    publisher: this.publisherControl,
    price: this.priceControl,
    stock: this.stockControl,
    coverImage: this.coverImageControl,
    description: this.descControl,
    author: this.authorControl,
    isbn: this.isbnControl,
    sapCode: this.sapCodeControl,
    publishedYear: this.publishedYearControl,
    pages: this.pagesControl,
    weight: this.weightControl
  });

  categoryOptions = computed(() => {
    return this.productStore.categories().map(c => ({ value: c.id, label: c.name }));
  });

  authorOptions = computed(() => {
    return this.authorStore.authors().map(a => ({ value: a.id, label: a.name }));
  });

  toggleAuthor(authorId: string) {
    const current = this.authorControl.value || [];
    const idx = current.indexOf(authorId);
    if (idx >= 0) {
      this.authorControl.setValue(current.filter(id => id !== authorId));
    } else {
      this.authorControl.setValue([...current, authorId]);
    }
    this.authorControl.markAsDirty();
  }

  isAuthorSelected(authorId: string): boolean {
    return (this.authorControl.value || []).includes(authorId);
  }

  additionalImagesControls = signal<AdditionalImage[]>([]);

  addAdditionalImage() {
    this.additionalImagesControls.update(imgs => [...imgs, { no: imgs.length + 1, image: '' }]);
  }

  updateAdditionalImage(index: number, value: string) {
    this.additionalImagesControls.update(imgs => {
      const newImgs = [...imgs];
      newImgs[index] = { ...newImgs[index], image: value };
      return newImgs;
    });
  }

  removeAdditionalImage(index: number) {
    this.additionalImagesControls.update(imgs => imgs.filter((_, i) => i !== index));
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject('Gagal membaca berkas gambar.');
      reader.readAsDataURL(file);
    });
  }

  async onCoverImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const base64 = await this.readFileAsBase64(input.files[0]);
        this.coverImageControl.setValue(base64);
        this.coverImageControl.markAsDirty();
        this.cdr.markForCheck();
      } catch (err) {
        this.alertService.error('Error', String(err));
      }
    }
  }

  async onAdditionalImageChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const base64 = await this.readFileAsBase64(input.files[0]);
        this.updateAdditionalImage(index, base64);
        this.cdr.markForCheck();
      } catch (err) {
        this.alertService.error('Error', String(err));
      }
    }
  }

  constructor() {
    this.authorStore.loadAuthors();
    effect(() => {
      const prod = this.product();
      if (prod) {
        this.titleControl.setValue(prod.title);
        this.categoryControl.setValue(prod.categoryId);
        this.publisherControl.setValue(prod.publisher);
        this.priceControl.setValue(prod.price);
        this.stockControl.setValue(prod.stock);
        this.coverImageControl.setValue(prod.coverImage || '');
        this.additionalImagesControls.set(prod.additionalImages?.length > 0 ? prod.additionalImages : []);
        this.descControl.setValue(prod.description);
        this.authorControl.setValue(prod.authorIds || []);
        this.isbnControl.setValue(prod.isbn || '');
        this.sapCodeControl.setValue(prod.sapCode || '');
        this.publishedYearControl.setValue(prod.publishedYear || new Date().getFullYear());
        this.pagesControl.setValue(prod.pages || 0);
        this.weightControl.setValue(prod.weight ? prod.weight * 1000 : 0);
      } else {
        this.productForm.reset();
        this.priceControl.setValue(0);
        this.stockControl.setValue(0);
        this.coverImageControl.setValue('');
        this.additionalImagesControls.set([]);
        this.publishedYearControl.setValue(new Date().getFullYear());
        this.pagesControl.setValue(0);
        this.weightControl.setValue(0);
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

    const allAdditionalImages = this.additionalImagesControls()
      .filter(img => img.image.trim() !== '')
      .map((img, index) => ({
        no: index + 1,
        image: img.image
      }));

    const unformat = (v: any) => parseFloat(String(v || '0').replace(/\./g, ''));

    const pData: Product = {
      id: this.product()?.id || '',
      title: this.titleControl.value || '',
      sapCode: this.sapCodeControl.value || '',
      authorIds: this.authorControl.value || [],
      authors: [],
      authorNames: '',
      isbn: this.isbnControl.value || '',
      categoryId: catId,
      price: unformat(this.priceControl.value),
      description: this.descControl.value || '',
      coverImage: this.coverImageControl.value || '',
      publisher: this.publisherControl.value || '',
      publishedYear: this.publishedYearControl.value || 0,
      pages: unformat(this.pagesControl.value),
      weight: unformat(this.weightControl.value) / 1000,
      stock: unformat(this.stockControl.value),
      averageRating: this.product()?.averageRating || 0,
      totalReviews: this.product()?.totalReviews || 0,
      createdAt: this.product()?.createdAt || new Date().toISOString(),
      additionalImages: allAdditionalImages
    };

    await this.productStore.saveProduct(pData);
    this.alertService.success('Berhasil!', 'Data produk berhasil disimpan.');
    this.onSave.emit();
  }
}
