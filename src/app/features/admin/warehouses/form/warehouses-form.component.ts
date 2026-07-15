import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Warehouse } from '../../../../core/models';
import { WarehouseStore } from '../../../../store/warehouse.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AdminCheckboxComponent } from '../../../../shared/ui/admin-checkbox/admin-checkbox.component';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-warehouses-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent, AdminCheckboxComponent],
  templateUrl: './warehouses-form.component.html'
})
export class WarehousesFormComponent {
  readonly warehouse = input<Warehouse | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  private readonly warehouseStore = inject(WarehouseStore);
  private readonly alertService = inject(AlertService);

  codeControl = new FormControl('', [Validators.required]);
  nameControl = new FormControl('', [Validators.required]);
  descriptionControl = new FormControl('', [Validators.required]);
  isActiveControl = new FormControl(true, [Validators.required]);

  formGroup = new FormGroup({
    code: this.codeControl,
    name: this.nameControl,
    description: this.descriptionControl,
    isActive: this.isActiveControl
  });

  constructor() {
    effect(() => {
      const w = this.warehouse();
      if (w) {
        this.codeControl.setValue(w.code);
        this.nameControl.setValue(w.name);
        this.descriptionControl.setValue(w.description);
        this.isActiveControl.setValue(w.isActive);
      } else {
        this.formGroup.reset({ code: '', name: '', description: '', isActive: true });
      }
    });
  }

  async onSubmitForm() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Gudang?',
      'Apakah Anda yakin ingin menyimpan perubahan data gudang ini?'
    );
    if (!isConfirmed) return;

    const data: Partial<Warehouse> = {
      id: this.warehouse()?.id,
      code: this.codeControl.value || '',
      name: this.nameControl.value || '',
      description: this.descriptionControl.value || '',
      isActive: this.isActiveControl.value ?? true
    };

    await this.warehouseStore.saveWarehouse(data);
    this.onSave.emit();
  }
}
