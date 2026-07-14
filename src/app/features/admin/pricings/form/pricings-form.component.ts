import { Component, input, output, effect, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Pricing, PricingDetail } from '../../../../core/models';
import { PricingStore } from '../../../../store/pricing.store';
import { ItemStore } from '../../../../store/item.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { computed } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pricings-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent, AdminSelectComponent, IconComponent, DecimalPipe],
  templateUrl: './pricings-form.component.html'
})
export class PricingsFormComponent {
  readonly pricing = input<Pricing | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  private readonly pricingStore = inject(PricingStore);
  protected readonly itemStore = inject(ItemStore);
  private readonly alertService = inject(AlertService);

  nameControl = new FormControl('', [Validators.required]);
  itemIdControl = new FormControl('', [Validators.required]);
  startDateControl = new FormControl('', [Validators.required]);
  endDateControl = new FormControl('', [Validators.required]);
  isActiveControl = new FormControl(true, [Validators.required]);

  formGroup = new FormGroup({
    name: this.nameControl,
    itemId: this.itemIdControl,
    startDate: this.startDateControl,
    endDate: this.endDateControl,
    isActive: this.isActiveControl
  });

  details = signal<PricingDetail[]>([]);

  // Add detail form controls
  detailCustomerGroupCode = new FormControl('PUBLIC', [Validators.required]);
  detailUomCode = new FormControl('', [Validators.required]);
  detailPrice = new FormControl(0, [Validators.required, Validators.min(0)]);

  customerGroupOptions = [
    { value: 'PUBLIC', label: 'Umum (Public)' },
    { value: 'VIP', label: 'Pelanggan VIP' },
    { value: 'WHOLESALER', label: 'Grosir / Wholesaler' },
    { value: 'RESELLER', label: 'Reseller' }
  ];

  itemOptions = computed(() => {
    const list = this.itemStore.items() || [];
    return [
      { value: '', label: '-- Pilih Item --' },
      ...list.map(i => ({ value: i.id, label: i.name }))
    ];
  });

  itemMap = computed(() => {
    const list = this.itemStore.items() || [];
    return new Map(list.map(i => [i.id, i]));
  });

  constructor() {
    this.itemStore.loadItems();

    effect(() => {
      const pr = this.pricing();
      if (pr) {
        this.nameControl.setValue(pr.name);
        this.itemIdControl.setValue(pr.itemId);
        this.startDateControl.setValue(pr.startDate ? pr.startDate.substring(0, 10) : '');
        this.endDateControl.setValue(pr.endDate ? pr.endDate.substring(0, 10) : '');
        this.isActiveControl.setValue(pr.isActive);
        this.details.set(pr.details || []);
      } else {
        this.formGroup.reset({ name: '', itemId: '', startDate: '', endDate: '', isActive: true });
        this.details.set([]);
      }
    });

    // Auto set UoM code when header item is picked (for default detail uom)
    this.itemIdControl.valueChanges.subscribe(itemId => {
      if (itemId) {
        const item = this.itemMap().get(itemId);
        if (item) {
          this.detailUomCode.setValue(item.baseUomCode);
        }
      } else {
        this.detailUomCode.setValue('');
      }
    });
  }

  addDetail() {
    const customerGroupCode = this.detailCustomerGroupCode.value;
    const uomCode = this.detailUomCode.value?.trim();
    const price = this.detailPrice.value ?? 0;

    if (!customerGroupCode || !uomCode) {
      this.alertService.error('Detail Tidak Lengkap!', 'Customer Group dan Kode UoM wajib diisi.');
      return;
    }

    const newDetail: PricingDetail = { customerGroupCode, uomCode, price };
    const current = [...this.details()];
    // Prevent duplicate customer group + uom combination
    const exists = current.some(d => d.customerGroupCode === customerGroupCode && d.uomCode === uomCode);
    if (exists) {
      this.alertService.error('Duplikat Detail!', 'Customer Group dan UoM ini sudah ada di daftar.');
      return;
    }

    this.details.set([...current, newDetail]);
    this.detailCustomerGroupCode.reset('PUBLIC');
    // keep detailUomCode to what it was
    this.detailPrice.reset(0);
  }

  removeDetail(index: number) {
    this.details.set(this.details().filter((_, i) => i !== index));
  }

  async onSubmitForm() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    if (this.details().length === 0) {
      this.alertService.error('Detail Kosong!', 'Setidaknya harus ada satu detail harga.');
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Pricing Master?',
      'Apakah Anda yakin ingin menyimpan perubahan data pricing master ini?'
    );
    if (!isConfirmed) return;

    const data: Partial<Pricing> = {
      id: this.pricing()?.id,
      name: this.nameControl.value || '',
      itemId: this.itemIdControl.value || '',
      startDate: new Date(this.startDateControl.value || '').toISOString(),
      endDate: new Date(this.endDateControl.value || '').toISOString(),
      isActive: this.isActiveControl.value ?? true,
      details: this.details()
    };

    await this.pricingStore.savePricing(data);
    this.onSave.emit();
  }
}
