import { Component, input, output, effect, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Pricing, PricingDetail } from '../../../../core/models';
import { PricingStore } from '../../../../store/pricing.store';
import { ItemStore } from '../../../../store/item.store';
import { UomGroupStore } from '../../../../store/uom-group.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { AdminCheckboxComponent } from '../../../../shared/ui/admin-checkbox/admin-checkbox.component';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { computed } from '@angular/core';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';
import itemFilteredData from '../../../../../fixtures/item_filtered.json';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pricings-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent, AdminSelectComponent, AdminCheckboxComponent, IconComponent, DecimalPipe, TooltipDirective],
  templateUrl: './pricings-form.component.html'
})
export class PricingsFormComponent {
  readonly pricing = input<Pricing | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  private readonly pricingStore = inject(PricingStore);
  protected readonly itemStore = inject(ItemStore);
  private readonly uomGroupStore = inject(UomGroupStore);
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
  selectedItemId = signal<string>('');

  // Add detail form controls
  detailCustomerGroupCode = new FormControl('100', [Validators.required]);
  detailUomCode = new FormControl('', [Validators.required]);
  detailPrice = new FormControl(0, [Validators.required, Validators.min(0)]);

  customerGroupOptions = [
    { value: '100', label: 'Mitra' },
    { value: '102', label: 'Warung' },
    { value: '103', label: 'Online' },
    { value: '104', label: 'Grosir' },
    { value: '105', label: 'Member' },
    { value: '106', label: 'Non Member' }
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

  selectedItemUomGroupName = computed(() => {
    const selectedId = this.selectedItemId();
    if (selectedId) {
      const item = this.itemMap().get(selectedId);
      if (item && item.uomGroupId) {
        const group = this.uomGroupStore.uomGroups()?.find(g => g.id === item.uomGroupId);
        if (group) return group.name;
      }
      if (item && item.baseUomCode) return item.baseUomCode;
    }
    return '';
  });

  uomGroupControl = new FormControl({ value: '', disabled: true });

  uomOptions = computed(() => {
    const selectedId = this.selectedItemId();
    const items = this.itemMap();
    const uomGroups = this.uomGroupStore.uomGroups() || [];

    let availableUoms: {value: string, label: string}[] = [];

    if (selectedId && items.has(selectedId)) {
      const item = items.get(selectedId);
      if (item?.uomGroupId) {
        const group = uomGroups.find(g => g.id === item.uomGroupId);
        if (group && group.details) {
          availableUoms = group.details.map(d => ({ value: d.code, label: `${d.code} - ${d.name}` }));
        }
      }
      if (availableUoms.length === 0 && item?.baseUomCode) {
        availableUoms = [{ value: item.baseUomCode, label: item.baseUomCode }];
      }
    }

    if (availableUoms.length === 0) {
      const allUoms = new Map<string, string>();
      uomGroups.forEach(g => {
        g.details?.forEach(d => allUoms.set(d.code, d.name));
      });
      availableUoms = Array.from(allUoms.entries()).map(([code, name]) => ({ value: code, label: `${code} - ${name}` }));
    }
    
    return availableUoms;
  });

  constructor() {
    this.itemStore.loadItems();
    this.uomGroupStore.loadUomGroups();

    effect(() => {
      const pr = this.pricing();
      if (pr) {
        this.nameControl.setValue(pr.name);
        this.itemIdControl.setValue(pr.itemId || '');
        this.startDateControl.setValue(pr.startDate ? pr.startDate.substring(0, 10) : '');
        this.endDateControl.setValue(pr.endDate ? pr.endDate.substring(0, 10) : '');
        this.isActiveControl.setValue(pr.isActive);
        this.details.set(pr.details || []);
      } else {
        this.formGroup.reset({ name: '', itemId: '', startDate: '', endDate: '', isActive: true });
        this.details.set([]);
      }
    });

    effect(() => {
      this.uomGroupControl.setValue(this.selectedItemUomGroupName());
    });

    // Auto set UoM code when header item is picked (for default detail uom)
    this.itemIdControl.valueChanges.subscribe(itemId => {
      this.selectedItemId.set(itemId || '');
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
    this.detailCustomerGroupCode.reset('100');
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

    let itemCode = '';
    const itemId = this.itemIdControl.value || '';
    if (itemId) {
      const item = this.itemMap().get(itemId);
      if (item) {
        itemCode = item.sapCode;
      }
    }

    const data: Partial<Pricing> = {
      id: this.pricing()?.id,
      name: this.nameControl.value || '',
      itemId: itemId,
      itemCode: itemCode,
      startDate: new Date(this.startDateControl.value || '').toISOString(),
      endDate: new Date(this.endDateControl.value || '').toISOString(),
      isActive: this.isActiveControl.value ?? true,
      details: this.details()
    };

    await this.pricingStore.savePricing(data);
    this.onSave.emit();
  }

  async bulkInsert() {
    const isConfirmed = await this.alertService.confirm(
      'Bulk Insert Pricing?',
      'Apakah Anda yakin ingin melakukan bulk insert pricing data dari JSON?'
    );
    if (!isConfirmed) return;

    const items = this.itemStore.items() || [];
    const itemMap = new Map(items.map(i => [i.name, i]));
    const dataList = itemFilteredData as any[];

    for (const data of dataList) {
      const sku = data['SKU'];
      const price = data['HARGA JUAL'];

      const item = itemMap.get(sku);
      if (item) {
        const payload: any = {
          name: `Harga Jual - ${sku}`,
          itemId: item.id,
          itemCode: item.sapCode,
          startDate: new Date().toISOString(),
          endDate: new Date('2036-12-31T23:59:59.000Z').toISOString(),
          isActive: true,
          details: [
            {
              customerGroupCode: '103', // Online
              uomCode: 'JASA', // uomCode tetap JASA
              price: price
            },
            {
              customerGroupCode: '106', // Non Member (lebih mahal 20%)
              uomCode: 'JASA', // uomCode tetap JASA
              price: Math.round(price * 1.2) // Kenaikan 20% (di antara 15-25%)
            }
          ]
        };
        await this.pricingStore.savePricing(payload);
      } else {
        console.warn(`Item dengan SKU "${sku}" tidak ditemukan di master data.`);
      }
    }

    this.onSave.emit();
  }
}
