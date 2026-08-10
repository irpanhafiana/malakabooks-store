import { Component, input, output, effect, inject, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ItemStore } from '../../../../store/item.store';
import { UomGroupStore } from '../../../../store/uom-group.store';
import { AuthorStore } from '../../../../store/author.store';
import { CategoryApiService } from '../../../../core/services/category-api.service';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { AlertService } from '../../../../core/services/alert.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { computed } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { EditorComponent } from '../../../../shared/ui/editor/editor.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-items-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent, AdminSelectComponent, EditorComponent, IconComponent, TooltipDirective],
  templateUrl: './items-form.component.html'
})
export class ItemsFormComponent {
  protected readonly isProduction = environment.production;
  readonly item = input<any>(null);
  readonly cancel = output<void>();
  readonly save = output<void>();
  readonly itemTypeChange = output<string>();

  private readonly itemStore = inject(ItemStore);
  protected readonly uomGroupStore = inject(UomGroupStore);
  protected readonly authorStore = inject(AuthorStore);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly alertService = inject(AlertService);
  private readonly logger = inject(LoggerService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly skuList = signal<string[]>([]);
  readonly categories = signal<any[]>([]);

  nameControl = new FormControl('', [Validators.required]);
  sapCodeControl = new FormControl('');
  itemTypeControl = new FormControl('mardika', [Validators.required]);
  uomGroupIdControl = new FormControl('');
  baseUomCodeControl = new FormControl('', [Validators.required]);
  descriptionControl = new FormControl('');
  isActiveControl = new FormControl(false, [Validators.required]);
  coverImageControl = new FormControl('');

  // Additional images
  additionalImagesControl = new FormArray<FormControl<string | null>>([]);

  // Book specific fields
  isbnControl = new FormControl('');
  categoryIdControl = new FormControl('');
  publisherControl = new FormControl('');
  publishedYearControl = new FormControl<number>(new Date().getFullYear());
  pagesControl = new FormControl<number>(0);
  weightControl = new FormControl<number>(0);

  selectedAuthorIds = signal<string[]>([]);
  authorSelectControl = new FormControl('');

  categoryIdSignal = toSignal(this.categoryIdControl.valueChanges, { initialValue: this.categoryIdControl.value });
  isMerchandise = computed(() => {
    const catId = this.categoryIdSignal();
    const cat = this.categories().find(c => c.id === catId);
    return cat ? cat.name.toLowerCase() === 'merchandise' : false;
  });

  formGroup = new FormGroup({
    name: this.nameControl,
    sapCode: this.sapCodeControl,
    itemType: this.itemTypeControl,
    uomGroupId: this.uomGroupIdControl,
    baseUomCode: this.baseUomCodeControl,
    description: this.descriptionControl,
    isActive: this.isActiveControl,
    coverImage: this.coverImageControl,
    additionalImages: this.additionalImagesControl,
    isbn: this.isbnControl,
    categoryId: this.categoryIdControl,
    publisher: this.publisherControl,

    publishedYear: this.publishedYearControl,
    pages: this.pagesControl,
    weight: this.weightControl
  });

  uomGroupOptions = computed(() => {
    const list = this.uomGroupStore.uomGroups() || [];
    return [
      { value: '', label: 'Tanpa UoM Group' },
      ...list.map(g => ({ value: g.id, label: g.name }))
    ];
  });

  categoryOptions = computed(() => {
    const list = this.categories() || [];
    return [
      { value: '', label: 'Pilih Kategori' },
      ...list.map(c => ({ value: c.id, label: c.name }))
    ];
  });

  authorOptions = computed(() => {
    const list = this.authorStore.authors() || [];
    return [
      { value: '', label: 'Pilih Penulis' },
      ...list.map(a => ({ value: a.id, label: a.name }))
    ];
  });

  itemTypeOptions = [
    { value: 'mardika', label: 'Item Kopi (Mardika)' },
    { value: 'malaka', label: 'Buku (Malaka)' },
    { value: 'ssonline', label: 'SS Online' }
  ];

  protected readonly coverImageFile = signal<File | null>(null);
  protected readonly additionalImageFiles = new Map<FormControl, File>();

  constructor() {
    this.uomGroupStore.loadUomGroups();
    this.authorStore.loadAuthors();
    this.loadCategories();

    effect(() => {
      const it = this.item();
      this.coverImageFile.set(null);
      this.additionalImageFiles.clear();

      if (it) {
        this.nameControl.setValue(it.name || it.title || '');
        this.sapCodeControl.setValue(it.sapCode || '');
        this.itemTypeControl.setValue(it.itemType || 'mardika');
        this.uomGroupIdControl.setValue(it.uomGroupId || '');
        this.baseUomCodeControl.setValue(it.baseUomCode || '');
        this.descriptionControl.setValue(it.description || '');
        this.isActiveControl.setValue(it.isActive ?? false);
        this.coverImageControl.setValue(it.coverImage || '');

        this.additionalImagesControl.clear();
        if (it.additionalImages && Array.isArray(it.additionalImages)) {
          const sorted = [...it.additionalImages].sort((a, b) => (a.no || 0) - (b.no || 0));
          sorted.forEach(img => {
            this.additionalImagesControl.push(new FormControl(img.image || ''));
          });
        }

        // Book fields
        this.isbnControl.setValue(it.isbn || '');
        this.categoryIdControl.setValue(it.categoryId || '');
        this.publisherControl.setValue(it.publisher || '');
        this.publishedYearControl.setValue(it.publishedYear || new Date().getFullYear());
        this.pagesControl.setValue(it.pages || 0);
        this.weightControl.setValue(it.weight || 0);

        if (it.authorIds && Array.isArray(it.authorIds)) {
          this.selectedAuthorIds.set(it.authorIds);
        } else {
          this.selectedAuthorIds.set([]);
        }
      } else {
        this.additionalImagesControl.clear();
        this.selectedAuthorIds.set([]);
        this.formGroup.reset({
          name: '', sapCode: crypto.randomUUID(), itemType: 'mardika', uomGroupId: '', baseUomCode: '', description: '', isActive: false,
          coverImage: '',
          isbn: '', categoryId: '', publisher: '', publishedYear: new Date().getFullYear(), pages: 0, weight: 0
        });
      }
    });

    this.uomGroupIdControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(uomId => {
      if (uomId) {
        const uom = this.uomGroupStore.uomGroups().find(g => g.id === uomId);
        if (uom) {
          this.baseUomCodeControl.setValue(uom.baseUomCode);
        }
      } else {
        this.baseUomCodeControl.setValue('');
      }
    });

    this.itemTypeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      this.itemTypeChange.emit(val || 'mardika');
    });

    this.authorSelectControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(authorId => {
      if (authorId) {
        const current = this.selectedAuthorIds();
        if (!current.includes(authorId)) {
          this.selectedAuthorIds.set([...current, authorId]);
        }
        // Reset control so user can pick again
        this.authorSelectControl.setValue('', { emitEvent: false });
      }
    });
  }

  removeAuthor(authorId: string) {
    this.selectedAuthorIds.update(ids => ids.filter(id => id !== authorId));
  }

  getAuthorName(id: string): string {
    return this.authorStore.authors().find(a => a.id === id)?.name || id;
  }

  async loadCategories() {
    try {
      const cats = await this.categoryApi.getCategories();
      this.categories.set(cats);
    } catch (e) {
      this.logger.error('Gagal memuat kategori', e);
    }
  }

  addAdditionalImage() {
    this.additionalImagesControl.push(new FormControl(''));
  }

  removeCoverImage() {
    this.coverImageControl.setValue('');
    this.coverImageFile.set(null);
  }

  removeAdditionalImage(index: number) {
    const control = this.additionalImagesControl.at(index);
    if (control) {
      this.additionalImageFiles.delete(control);
    }
    this.additionalImagesControl.removeAt(index);
  }

  getPayload(): any {
    const additionalImgs = this.additionalImagesControl.controls
      .map((ctrl, i) => ({ no: i + 1, image: ctrl.value }))
      .filter(img => !!img.image);

    const additionalFiles = this.additionalImagesControl.controls
      .map(ctrl => this.additionalImageFiles.get(ctrl))
      .filter((file): file is File => file instanceof File);

    const selectedCat = this.categories().find(c => c.id === this.categoryIdControl.value);
    const categoryName = selectedCat ? selectedCat.name : '';

    const payload: any = {
      id: this.item()?.id,
      name: this.nameControl.value || '',
      sapCode: this.sapCodeControl.value || (this.item()?.id ? '' : crypto.randomUUID()),
      itemType: this.itemTypeControl.value || 'mardika',
      categoryId: this.categoryIdControl.value || undefined,
      uomGroupId: this.uomGroupIdControl.value || undefined,
      baseUomCode: this.baseUomCodeControl.value || '',
      description: this.descriptionControl.value || '',
      isActive: this.isActiveControl.value ?? false,
      coverImage: this.coverImageControl.value || '',
      coverImageFile: this.coverImageFile(),
      additionalImages: additionalImgs,
      additionalImageFiles: additionalFiles,
      weight: this.weightControl.value || 0,
      stock: 0,
      categoryName: categoryName
    };

    if (payload.uomGroupId) {
      const uomGroupObj = this.uomGroupStore.uomGroups().find(g => g.id === payload.uomGroupId);
      if (uomGroupObj) {
        payload.uomGroup = uomGroupObj;
      }
    }

    if (payload.itemType === 'malaka') {
      payload.bookId = this.item()?.bookId;
      payload.isbn = this.isbnControl.value || '';
      payload.publisher = this.publisherControl.value || '';
      payload.publishedYear = this.publishedYearControl.value || 0;
      payload.pages = this.pagesControl.value || 0;
      payload.authorIds = this.selectedAuthorIds();
    }

    return payload;
  }

  async onSubmitForm() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Produk?',
      'Apakah Anda yakin ingin menyimpan perubahan data produk ini?'
    );
    if (!isConfirmed) return;

    const data = this.getPayload();
    await this.itemStore.saveItem(data);
    this.save.emit();
  }

  async bulkInsert() {
    const isConfirmed = await this.alertService.confirm(
      'Bulk Insert?',
      'Apakah Anda yakin ingin melakukan bulk insert data dari JSON?'
    );
    if (!isConfirmed) return;

    let defaultCoverFile: File | null = null;
    try {
      // Pastikan menggunakan / di awal agar fetch dari root (public folder)
      const response = await fetch('/default.png');
      if (response.ok) {
        const blob = await response.blob();
        defaultCoverFile = new File([blob], 'default.png', { type: blob.type });
      } else {
        this.logger.error('File default.png tidak ditemukan (status HTTP tidak ok)');
      }
    } catch (e) {
      this.logger.warn('Gagal memuat gambar /default.png', e);
    }

    if (this.skuList().length === 0) {
      const skuDataModule = await import('../../../../../fixtures/sku_only.json');
      this.skuList.set(skuDataModule.default as string[]);
    }

    for (const sku of this.skuList()) {
      const payload: any = {
        name: sku,
        sapCode: crypto.randomUUID(),
        itemType: 'ssonline',
        categoryId: '6a75858e154b28c7022892aa',
        uomGroupId: '6a75861e154b28c7022892ab',
        baseUomCode: 'PCS',
        isActive: false,
        weight: 100,
        stock: 0,
        description: '<p>asd</p>',
        coverImage: '',
        coverImageFile: defaultCoverFile,
        additionalImages: [],
        additionalImageFiles: [],
        categoryName: 'Merchandise',
        uomGroup: {
          name: 'UOM-EXAMPLE',
          baseUomCode: 'PCS',
          isActive: true,
          details: [
            {
              code: 'PCS',
              name: 'PCS',
              conversionFactor: 1,
              isBaseUom: true,
              isDefaultForSales: true,
              sortOrder: 1,
              isActive: true
            },
            {
              code: 'BOX',
              name: 'BOX',
              conversionFactor: 12,
              isBaseUom: false,
              isDefaultForSales: false,
              sortOrder: 1,
              isActive: true
            }
          ]
        }
      };
      
      await this.itemStore.saveItem(payload);
    }

    this.save.emit();
  }

  onCoverUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.coverImageFile.set(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.coverImageControl.setValue(reader.result as string);
      this.cdr.markForCheck();
    };
    reader.onerror = () => {
      this.logger.error('Gagal membaca berkas gambar sampul');
    };
    reader.readAsDataURL(file);

    input.value = '';
  }

  onAdditionalImageUpload(event: Event, control: FormControl) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.additionalImageFiles.set(control, file);

    const reader = new FileReader();
    reader.onload = () => {
      control.setValue(reader.result as string);
      this.cdr.markForCheck();
    };
    reader.onerror = () => {
      this.logger.error('Gagal membaca berkas gambar tambahan');
    };
    reader.readAsDataURL(file);

    input.value = '';
  }
}
