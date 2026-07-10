import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CatalogItem } from '../../../../core/models';
import { ItemStore } from '../../../../store/item.store';
import { UomGroupStore } from '../../../../store/uom-group.store';
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
  readonly item = input<CatalogItem | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  private readonly itemStore = inject(ItemStore);
  protected readonly uomGroupStore = inject(UomGroupStore);
  private readonly alertService = inject(AlertService);

  nameControl = new FormControl('', [Validators.required]);
  sapCodeControl = new FormControl('', [Validators.required]);
  itemTypeControl = new FormControl('Book', [Validators.required]);
  uomGroupIdControl = new FormControl('');
  baseUomCodeControl = new FormControl('', [Validators.required]);
  descriptionControl = new FormControl('');
  isActiveControl = new FormControl(true, [Validators.required]);

  formGroup = new FormGroup({
    name: this.nameControl,
    sapCode: this.sapCodeControl,
    itemType: this.itemTypeControl,
    uomGroupId: this.uomGroupIdControl,
    baseUomCode: this.baseUomCodeControl,
    description: this.descriptionControl,
    isActive: this.isActiveControl
  });

  uomGroupOptions = computed(() => {
    const list = this.uomGroupStore.uomGroups() || [];
    return [
      { value: '', label: 'Tanpa UoM Group' },
      ...list.map(g => ({ value: g.id, label: g.name }))
    ];
  });

  itemTypeOptions = [
    { value: 'Book', label: 'Buku' },
    { value: 'Other', label: 'Lainnya' }
  ];

  constructor() {
    this.uomGroupStore.loadUomGroups();

    effect(() => {
      const it = this.item();
      if (it) {
        this.nameControl.setValue(it.name);
        this.sapCodeControl.setValue(it.sapCode);
        this.itemTypeControl.setValue(it.itemType);
        this.uomGroupIdControl.setValue(it.uomGroupId || '');
        this.baseUomCodeControl.setValue(it.baseUomCode);
        this.descriptionControl.setValue(it.description || '');
        this.isActiveControl.setValue(it.isActive);
      } else {
        this.formGroup.reset({ name: '', sapCode: '', itemType: 'Book', uomGroupId: '', baseUomCode: '', description: '', isActive: true });
      }
    });

    // Automatically set baseUomCode when uomGroupId changes
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

    const data: Partial<CatalogItem> = {
      id: this.item()?.id,
      name: this.nameControl.value || '',
      sapCode: this.sapCodeControl.value || '',
      itemType: this.itemTypeControl.value || 'Book',
      uomGroupId: this.uomGroupIdControl.value || undefined,
      baseUomCode: this.baseUomCodeControl.value || '',
      description: this.descriptionControl.value || '',
      isActive: this.isActiveControl.value ?? true
    };

    await this.itemStore.saveItem(data);
    this.onSave.emit();
  }
}
