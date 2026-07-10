import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WarehouseStock } from '../../../../core/models';
import { WarehouseStockStore } from '../../../../store/warehouse-stock.store';
import { WarehouseStore } from '../../../../store/warehouse.store';
import { ItemStore } from '../../../../store/item.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { AlertService } from '../../../../core/services/alert.service';
import { computed } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stocks-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent, AdminSelectComponent],
  templateUrl: './stocks-form.component.html'
})
export class StocksFormComponent {
  readonly stock = input<WarehouseStock | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  private readonly stockStore = inject(WarehouseStockStore);
  protected readonly warehouseStore = inject(WarehouseStore);
  protected readonly itemStore = inject(ItemStore);
  private readonly alertService = inject(AlertService);

  warehouseIdControl = new FormControl('', [Validators.required]);
  itemIdControl = new FormControl('', [Validators.required]);
  baseUomCodeControl = new FormControl('', [Validators.required]);
  quantityOnHandControl = new FormControl(0, [Validators.required, Validators.min(0)]);
  reservedQuantityControl = new FormControl(0, [Validators.required, Validators.min(0)]);

  formGroup = new FormGroup({
    warehouseId: this.warehouseIdControl,
    itemId: this.itemIdControl,
    baseUomCode: this.baseUomCodeControl,
    quantityOnHand: this.quantityOnHandControl,
    reservedQuantity: this.reservedQuantityControl
  });

  warehouseOptions = computed(() => {
    const list = this.warehouseStore.warehouses() || [];
    return [
      { value: '', label: '-- Pilih Gudang --' },
      ...list.map(w => ({ value: w.id, label: w.name }))
    ];
  });

  itemOptions = computed(() => {
    const list = this.itemStore.items() || [];
    return [
      { value: '', label: '-- Pilih Item --' },
      ...list.map(i => ({ value: i.id, label: i.name }))
    ];
  });

  constructor() {
    this.warehouseStore.loadWarehouses();
    this.itemStore.loadItems();

    effect(() => {
      const st = this.stock();
      if (st) {
        this.warehouseIdControl.setValue(st.warehouseId);
        this.itemIdControl.setValue(st.itemId);
        this.baseUomCodeControl.setValue(st.baseUomCode);
        this.quantityOnHandControl.setValue(st.quantityOnHand);
        this.reservedQuantityControl.setValue(st.reservedQuantity);
      } else {
        this.formGroup.reset({ warehouseId: '', itemId: '', baseUomCode: '', quantityOnHand: 0, reservedQuantity: 0 });
      }
    });

    // Automatically fill baseUomCode when itemId changes
    this.itemIdControl.valueChanges.subscribe(itemId => {
      if (itemId) {
        const item = this.itemStore.items().find(i => i.id === itemId);
        if (item) {
          this.baseUomCodeControl.setValue(item.baseUomCode);
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
      'Simpan Stok?',
      'Apakah Anda yakin ingin menyimpan perubahan data stok gudang ini?'
    );
    if (!isConfirmed) return;

    const data: Partial<WarehouseStock> = {
      id: this.stock()?.id,
      warehouseId: this.warehouseIdControl.value || '',
      itemId: this.itemIdControl.value || '',
      baseUomCode: this.baseUomCodeControl.value || '',
      quantityOnHand: this.quantityOnHandControl.value ?? 0,
      reservedQuantity: this.reservedQuantityControl.value ?? 0
    };

    await this.stockStore.saveWarehouseStock(data);
    this.onSave.emit();
  }
}
