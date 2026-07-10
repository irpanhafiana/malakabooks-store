import { Component, input, output, effect, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UomGroup, UomGroupDetail } from '../../../../core/models';
import { UomGroupStore } from '../../../../store/uom-group.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-uom-groups-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent, AdminSelectComponent, IconComponent],
  templateUrl: './uom-groups-form.component.html'
})
export class UomGroupsFormComponent {
  readonly uomGroup = input<UomGroup | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  private readonly uomGroupStore = inject(UomGroupStore);
  private readonly alertService = inject(AlertService);

  nameControl = new FormControl('', [Validators.required]);
  baseUomCodeControl = new FormControl('', [Validators.required]);
  isActiveControl = new FormControl(true, [Validators.required]);

  formGroup = new FormGroup({
    name: this.nameControl,
    baseUomCode: this.baseUomCodeControl,
    isActive: this.isActiveControl
  });

  details = signal<UomGroupDetail[]>([]);

  // Form states for adding a detail
  detailCode = new FormControl('');
  detailName = new FormControl('');
  detailFactor = new FormControl(1);
  detailIsBase = new FormControl(false);
  detailSortOrder = new FormControl(1);

  constructor() {
    effect(() => {
      const g = this.uomGroup();
      if (g) {
        this.nameControl.setValue(g.name);
        this.baseUomCodeControl.setValue(g.baseUomCode);
        this.isActiveControl.setValue(g.isActive);
        this.details.set(g.details || []);
      } else {
        this.formGroup.reset({ name: '', baseUomCode: '', isActive: true });
        this.details.set([]);
      }
    });
  }

  addDetail() {
    const code = this.detailCode.value?.trim();
    const name = this.detailName.value?.trim();
    const factor = this.detailFactor.value ?? 1;
    const isBase = this.detailIsBase.value ?? false;
    const sortOrder = this.detailSortOrder.value ?? 1;

    if (!code || !name) {
      this.alertService.error('Detail UoM tidak lengkap!', 'Kode dan nama detail wajib diisi.');
      return;
    }

    const newDetail: UomGroupDetail = {
      code,
      name,
      conversionFactor: factor,
      isBaseUom: isBase,
      sortOrder,
      isActive: true
    };

    // If marked as base UoM, ensure no other is base and update baseUomCode
    let current = [...this.details()];
    if (isBase) {
      current = current.map(d => ({ ...d, isBaseUom: false }));
      this.baseUomCodeControl.setValue(code);
    }

    this.details.set([...current, newDetail]);

    // Reset detail inputs
    this.detailCode.reset('');
    this.detailName.reset('');
    this.detailFactor.reset(1);
    this.detailIsBase.reset(false);
    this.detailSortOrder.reset(1);
  }

  removeDetail(index: number) {
    const current = this.details();
    const removed = current[index];
    this.details.set(current.filter((_, i) => i !== index));
    if (removed.isBaseUom) {
      this.baseUomCodeControl.setValue('');
    }
  }

  async onSubmitForm() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    if (this.details().length === 0) {
      this.alertService.error('Detail Kosong!', 'Setidaknya harus ada satu detail UoM.');
      return;
    }

    const hasBase = this.details().some(d => d.isBaseUom);
    if (!hasBase) {
      this.alertService.error('Base UoM Tidak Ada!', 'Harus ada satu detail yang menjadi Base UoM.');
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Satuan Ukuran?',
      'Apakah Anda yakin ingin menyimpan perubahan data satuan ukuran ini?'
    );
    if (!isConfirmed) return;

    const data: Partial<UomGroup> = {
      id: this.uomGroup()?.id,
      name: this.nameControl.value || '',
      baseUomCode: this.baseUomCodeControl.value || '',
      isActive: this.isActiveControl.value ?? true,
      details: this.details()
    };

    await this.uomGroupStore.saveUomGroup(data);
    this.onSave.emit();
  }
}
