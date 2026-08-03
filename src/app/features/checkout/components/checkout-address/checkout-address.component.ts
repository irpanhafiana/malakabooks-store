import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Address } from '../../../../core/models';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { RadioIndicatorComponent } from '../../../../shared/ui/radio-indicator/radio-indicator.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { MapPickerComponent } from '../../../../shared/ui/map-picker/map-picker.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-checkout-address',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    RadioIndicatorComponent,
    ButtonComponent,
    MapPickerComponent
  ],
  template: `
    <div class="bg-white border border-slate-100 p-4 rounded-lg">
      <h2 class="font-display font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
        <span class="h-6 w-6 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">1</span>
        Alamat Pengiriman
      </h2>

      @if (!showForm()) {
        @if (savedAddresses().length > 0) {
          <div class="flex flex-col gap-3">
            @for (addr of savedAddresses(); track addr.id) {
              <div (click)="selectAddress.emit(addr.id)"
                class="flex items-start gap-3.5 p-4 border rounded-lg cursor-pointer hover:bg-slate-50"
                [class.border-primary-500]="selectedAddressId() === addr.id"
                [class.border-slate-200]="selectedAddressId() !== addr.id">
                <app-radio-indicator [checked]="selectedAddressId() === addr.id" class="mt-1"></app-radio-indicator>
                <div class="flex flex-col text-xs leading-relaxed">
                  <strong class="font-bold text-slate-800">
                    {{ addr.name }}
                    @if (addr.isDefault) {
                      <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold ml-1">Default</span>
                    }
                  </strong>
                  <span class="text-slate-500 mt-1">{{ addr.phone }}</span>
                  <span class="text-slate-600 font-semibold">
                    {{ addr.street }}{{ addr.district ? ', ' + addr.district : '' }}, {{ addr.city }}, {{ addr.province }}, {{ addr.postalCode }}
                  </span>
                </div>
              </div>
            }
            <app-button type="button" (click)="addNewAddress.emit()" variant="ghost" size="sm"
              customClass="text-primary-600 hover:text-primary-700 !p-0 mt-1 flex items-center gap-1">
              + Tambah Alamat Baru
            </app-button>
          </div>
        } @else {
          <div class="text-center py-6 border border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-3">
            <p class="text-slate-500 text-xs">Anda belum memiliki alamat pengiriman yang tersimpan.</p>
            <app-button type="button" (click)="addNewAddress.emit()" variant="outline" size="sm">
              + Tambah Alamat Baru
            </app-button>
          </div>
        }
      } @else {
        <form [formGroup]="addressForm()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <app-input label="Nama Penerima" placeholder="e.g. Dewi Lestari" [control]="getControl('recipient')"></app-input>
          <app-input label="Nomor Telepon" placeholder="e.g. +628123456789" [control]="getControl('phone')"></app-input>
          <div class="sm:col-span-2">
            <app-input label="Alamat Lengkap (Jalan)" placeholder="e.g. Jl. Sudirman No. 21" [control]="getControl('street')"></app-input>
          </div>
          <app-select label="Provinsi" placeholder="Pilih Provinsi" [control]="getControl('province')" [options]="provinceOptions()"></app-select>
          <app-select label="Kota" placeholder="Pilih Kota" [control]="getControl('city')" [options]="cityOptions()"></app-select>
          <app-select label="Kecamatan" placeholder="Pilih Kecamatan" [control]="getControl('district')" [options]="districtOptions()"></app-select>
          <app-input label="Kode Pos" placeholder="e.g. 12730" [control]="getControl('postalCode')"></app-input>

          <div class="sm:col-span-2 mt-2">
            <label class="block text-sm font-medium text-slate-700 mb-2">Pin Lokasi Peta</label>
            <app-map-picker [initialLat]="selectedLat()" [initialLng]="selectedLng()" (locationSelected)="locationSelected.emit($event)">
            </app-map-picker>
            <p class="text-xs text-slate-500 mt-2">Klik peta atau geser pin untuk menyesuaikan titik koordinat.</p>
          </div>

          <div class="sm:col-span-2 flex justify-end gap-2.5 mt-2">
            <app-button type="button" (click)="cancelForm.emit()" variant="ghost" size="sm">Batal</app-button>
            <app-button type="button" (click)="saveForm.emit()" [disabled]="addressForm().invalid" variant="outline" size="sm">Simpan Alamat</app-button>
          </div>
        </form>
      }
    </div>
  `
})
export class CheckoutAddressComponent {
  savedAddresses = input.required<Address[]>();
  selectedAddressId = input<string | null>(null);
  showForm = input<boolean>(false);
  addressForm = input.required<FormGroup>();
  provinceOptions = input<{ value: string; label: string }[]>([]);
  cityOptions = input<{ value: string; label: string }[]>([]);
  districtOptions = input<{ value: string; label: string }[]>([]);
  selectedLat = input<number | undefined>(undefined);
  selectedLng = input<number | undefined>(undefined);

  selectAddress = output<string>();
  addNewAddress = output<void>();
  cancelForm = output<void>();
  saveForm = output<void>();
  locationSelected = output<{ latitude: number; longitude: number }>();

  getControl(name: string): FormControl {
    return this.addressForm().get(name) as FormControl;
  }
}
