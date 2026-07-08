import { Component, inject, OnInit, signal, computed, DestroyRef, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HomeAddress } from '../../../../core/models';
import { AdminHomeAddressStore } from '../../../../store/admin-home-address.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { AddressApiService } from '../../../../core/services/address-api.service';
import { MapPickerComponent } from '../../../../shared/ui/map-picker/map-picker.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home-addresses-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent, AdminSelectComponent, MapPickerComponent],
  templateUrl: './home-addresses-form.component.html'
})
export class HomeAddressesFormComponent implements OnInit {
  readonly address = input<HomeAddress | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  private readonly store = inject(AdminHomeAddressStore);
  private readonly addressApi = inject(AddressApiService);
  private readonly destroyRef = inject(DestroyRef);

  isLoading = signal<boolean>(false);
  
  // Simasrim states
  provinces = signal<any[]>([]);
  cities = signal<any[]>([]);
  districts = signal<any[]>([]);

  selectedLat = signal<number | undefined>(undefined);
  selectedLng = signal<number | undefined>(undefined);

  provinceOptions = computed(() => this.provinces().map(p => ({ value: p, label: p })));
  cityOptions = computed(() => this.cities().map(c => ({ value: c, label: c })));
  districtOptions = computed(() => this.districts().map(d => ({ value: d.region_code, label: d.subdistrict_name ? `${d.district_name} - ${d.subdistrict_name}` : d.district_name })));

  labelControl = new FormControl('', [Validators.required]);
  recipientControl = new FormControl('', [Validators.required]);
  phoneControl = new FormControl('', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]);
  streetControl = new FormControl('', [Validators.required]);
  provinceControl = new FormControl('', [Validators.required]);
  cityControl = new FormControl('', [Validators.required]);
  districtControl = new FormControl('', [Validators.required]);
  postalCodeControl = new FormControl('', [Validators.required]);

  form = new FormGroup({
    label: this.labelControl,
    recipientName: this.recipientControl,
    phone: this.phoneControl,
    street: this.streetControl,
    province: this.provinceControl,
    city: this.cityControl,
    district: this.districtControl,
    postalCode: this.postalCodeControl
  });

  async ngOnInit() {
    await this.loadProvinces();

    // Listen to province changes
    this.provinceControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (province) => {
      if (province) {
        const cts = await this.addressApi.getCities(province);
        this.cities.set(cts);

        const currentCityVal = this.cityControl.value;
        const exists = cts.some(c => c === currentCityVal);
        if (!exists) {
          this.cityControl.setValue('');
        }
      } else {
        this.cities.set([]);
        this.cityControl.setValue('');
      }
    });

    // Listen to city changes
    this.cityControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (city) => {
      if (city) {
        const dsts = await this.addressApi.getDistricts(this.provinceControl.value || '', city);
        this.districts.set(dsts);

        const currentDstVal = this.districtControl.value;
        const exists = dsts.some(d => d.region_code === currentDstVal);
        if (!exists) {
          this.districtControl.setValue('');
        }
      } else {
        this.districts.set([]);
        this.districtControl.setValue('');
      }
    });

    // Listen to district changes
    this.districtControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(distCode => {
      const dist = this.districts().find(d => d.region_code === distCode);
      if (dist && dist.latitude && dist.longitude) {
        this.selectedLat.set(Number(dist.latitude));
        this.selectedLng.set(Number(dist.longitude));
      }
    });

    const addr = this.address();
    if (addr) {
      this.selectedLat.set(addr.latitude);
      this.selectedLng.set(addr.longitude);
      await this.patchFormValues(addr);
    }
  }

  async loadProvinces() {
    const provs = await this.addressApi.getProvinces();
    this.provinces.set(provs);
  }

  async patchFormValues(addr: HomeAddress) {
    this.form.reset();

    this.labelControl.setValue(addr.label);
    this.recipientControl.setValue(addr.recipientName);
    this.phoneControl.setValue(addr.phone);
    this.streetControl.setValue(addr.street);
    this.postalCodeControl.setValue(addr.postalCode);

    // Map province string
    const prov = this.provinces().find(p => p.toLowerCase() === addr.province.toLowerCase());
    if (prov) {
      this.provinceControl.setValue(prov);

      this.isLoading.set(true);
      const cts = await this.addressApi.getCities(prov);
      this.cities.set(cts);
      this.isLoading.set(false);

      const city = cts.find(c => c.toLowerCase() === addr.city.toLowerCase());

      if (city) {
        this.cityControl.setValue(city);

        this.isLoading.set(true);
        const dsts = await this.addressApi.getDistricts(prov, city);
        this.districts.set(dsts);
        this.isLoading.set(false);

        const targetDistrict = addr.district?.toLowerCase();
        const targetSubDistrict = addr.subDistrict?.toLowerCase();
        
        let dist = undefined;
        if (targetDistrict) {
          dist = dsts.find(d => 
            d.district_name.toLowerCase() === targetDistrict && 
            (targetSubDistrict ? d.subdistrict_name?.toLowerCase() === targetSubDistrict : true)
          );
        }

        if (dist) {
          this.districtControl.setValue(dist.region_code);
        } else {
          this.districtControl.setValue('');
        }
      } else {
        this.cityControl.setValue('');
        this.districtControl.setValue('');
      }
    } else {
      this.provinceControl.setValue('');
      this.cityControl.setValue('');
      this.districtControl.setValue('');
    }
  }

  onMapLocationSelected(loc: { latitude: number; longitude: number }) {
    this.selectedLat.set(loc.latitude);
    this.selectedLng.set(loc.longitude);
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);

    const provName = this.provinceControl.value || '';
    const cityName = this.cityControl.value || '';
    const distCode = this.districtControl.value;
    
    const distObj = this.districts().find(d => d.region_code === distCode);
    const districtName = distObj ? distObj.district_name : '';
    const subDistrictName = distObj ? distObj.subdistrict_name : '';

    const payload: HomeAddress = {
      id: this.address()?.id || '',
      label: this.labelControl.value || '',
      recipientName: this.recipientControl.value || '',
      phone: this.phoneControl.value || '',
      street: this.streetControl.value || '',
      province: provName,
      city: cityName,
      district: districtName,
      subDistrict: subDistrictName || '',
      postalCode: this.postalCodeControl.value || '',
      addressCode: distObj?.origin_code || distCode || '',
      longitude: this.selectedLng() ?? (distObj?.longitude ? Number(distObj.longitude) : undefined) ?? this.address()?.longitude ?? 0,
      latitude: this.selectedLat() ?? (distObj?.latitude ? Number(distObj.latitude) : undefined) ?? this.address()?.latitude ?? 0
    };

    await this.store.saveAddress(payload);
    this.isLoading.set(false);
    this.onSave.emit();
  }

  handleCancel() {
    this.onCancel.emit();
  }
}
