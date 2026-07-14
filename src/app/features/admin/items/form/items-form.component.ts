import { Component, input, output, effect, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ItemStore } from '../../../../store/item.store';
import { UomGroupStore } from '../../../../store/uom-group.store';
import { AuthorStore } from '../../../../store/author.store';
import { CategoryApiService } from '../../../../core/services/category-api.service';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { AlertService } from '../../../../core/services/alert.service';
import { computed } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-items-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent, AdminSelectComponent],
  templateUrl: './items-form.component.html'
})
export class ItemsFormComponent {
  readonly item = input<any>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();
  readonly itemTypeChange = output<string>();

  private readonly itemStore = inject(ItemStore);
  protected readonly uomGroupStore = inject(UomGroupStore);
  protected readonly authorStore = inject(AuthorStore);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly alertService = inject(AlertService);

  readonly categories = signal<any[]>([]);

  nameControl = new FormControl('', [Validators.required]);
  sapCodeControl = new FormControl('');
  itemTypeControl = new FormControl('mardika', [Validators.required]);
  uomGroupIdControl = new FormControl('');
  baseUomCodeControl = new FormControl('', [Validators.required]);
  descriptionControl = new FormControl('');
  isActiveControl = new FormControl(true, [Validators.required]);

  // Book specific fields
  isbnControl = new FormControl('');
  categoryIdControl = new FormControl('');
  publisherControl = new FormControl('');
  publishedYearControl = new FormControl<number>(new Date().getFullYear());
  pagesControl = new FormControl<number>(0);
  priceControl = new FormControl<number>(0);
  weightControl = new FormControl<number>(0);
  stockControl = new FormControl<number>(0);
  
  // Note: For authors, we can just use a simple string array or manage multiple selects.
  // For simplicity since admin-select might not support multi-select, we'll store a single authorId or handle it in a custom way.
  // We'll use a single select for author for now, or just comma separated.
  // If authorIds is an array, we can use a basic select and just pick one author.
  authorIdControl = new FormControl('');

  formGroup = new FormGroup({
    name: this.nameControl,
    sapCode: this.sapCodeControl,
    itemType: this.itemTypeControl,
    uomGroupId: this.uomGroupIdControl,
    baseUomCode: this.baseUomCodeControl,
    description: this.descriptionControl,
    isActive: this.isActiveControl,
    isbn: this.isbnControl,
    categoryId: this.categoryIdControl,
    publisher: this.publisherControl,
    publishedYear: this.publishedYearControl,
    pages: this.pagesControl,
    price: this.priceControl,
    weight: this.weightControl,
    stock: this.stockControl,
    authorId: this.authorIdControl
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
    { value: 'malaka', label: 'Buku (Malaka)' }
  ];

  constructor() {
    this.uomGroupStore.loadUomGroups();
    this.authorStore.loadAuthors();
    this.loadCategories();

    effect(() => {
      const it = this.item();
      if (it) {
        this.nameControl.setValue(it.name || it.title || '');
        this.sapCodeControl.setValue(it.sapCode || '');
        this.itemTypeControl.setValue(it.itemType || 'mardika');
        this.uomGroupIdControl.setValue(it.uomGroupId || '');
        this.baseUomCodeControl.setValue(it.baseUomCode || '');
        this.descriptionControl.setValue(it.description || '');
        this.isActiveControl.setValue(it.isActive ?? true);
        
        // Book fields
        this.isbnControl.setValue(it.isbn || '');
        this.categoryIdControl.setValue(it.categoryId || '');
        this.publisherControl.setValue(it.publisher || '');
        this.publishedYearControl.setValue(it.publishedYear || new Date().getFullYear());
        this.pagesControl.setValue(it.pages || 0);
        this.priceControl.setValue(it.price || 0);
        this.weightControl.setValue(it.weight || 0);
        this.stockControl.setValue(it.stock || 0);
        
        if (it.authorIds && it.authorIds.length > 0) {
          this.authorIdControl.setValue(it.authorIds[0]);
        } else {
          this.authorIdControl.setValue('');
        }
      } else {
        this.formGroup.reset({ 
          name: '', sapCode: '', itemType: 'mardika', uomGroupId: '', baseUomCode: '', description: '', isActive: true,
          isbn: '', categoryId: '', publisher: '', publishedYear: new Date().getFullYear(), pages: 0, price: 0, weight: 0, stock: 0, authorId: ''
        });
      }
    });

    this.uomGroupIdControl.valueChanges.subscribe(uomId => {
      if (uomId) {
        const uom = this.uomGroupStore.uomGroups().find(g => g.id === uomId);
        if (uom) {
          this.baseUomCodeControl.setValue(uom.baseUomCode);
        }
      } else {
        this.baseUomCodeControl.setValue('');
      }
    });

    this.itemTypeControl.valueChanges.subscribe(val => {
      this.itemTypeChange.emit(val || 'mardika');
    });
  }

  async loadCategories() {
    try {
      const cats = await this.categoryApi.getCategories();
      this.categories.set(cats);
    } catch (e) {
      console.error(e);
    }
  }

  getPayload(): any {
    const payload: any = {
      id: this.item()?.id,
      name: this.nameControl.value || '',
      sapCode: this.sapCodeControl.value || '',
      itemType: this.itemTypeControl.value || 'mardika',
      uomGroupId: this.uomGroupIdControl.value || undefined,
      baseUomCode: this.baseUomCodeControl.value || '',
      description: this.descriptionControl.value || '',
      isActive: this.isActiveControl.value ?? true
    };

    if (payload.itemType === 'malaka') {
       payload.bookId = this.item()?.bookId;
       payload.title = this.nameControl.value || '';
       payload.isbn = this.isbnControl.value || '';
       payload.categoryId = this.categoryIdControl.value || undefined;
       payload.publisher = this.publisherControl.value || '';
       payload.publishedYear = this.publishedYearControl.value || 0;
       payload.pages = this.pagesControl.value || 0;
       payload.price = this.priceControl.value || 0;
       payload.weight = this.weightControl.value || 0;
       payload.stock = this.stockControl.value || 0;
       payload.authorIds = this.authorIdControl.value ? [this.authorIdControl.value] : [];
    }

    return payload;
  }

  async onSubmitForm() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Catalog Item?',
      'Apakah Anda yakin ingin menyimpan perubahan data catalog item ini?'
    );
    if (!isConfirmed) return;

    const data = this.getPayload();
    await this.itemStore.saveItem(data);
    this.onSave.emit();
  }
}
