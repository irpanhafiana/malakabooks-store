import { Component, input, output, effect, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PromotionBanner, CreatePromotionBannerRequest, UpdatePromotionBannerRequest } from '../../../../core/models';
import { PromotionBannerStore } from '../../../../store/promotion-banner.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AdminCheckboxComponent } from '../../../../shared/ui/admin-checkbox/admin-checkbox.component';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-promotion-banners-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent, AdminCheckboxComponent],
  template: `
    <form [formGroup]="bannerForm" (ngSubmit)="onSubmitForm()" class="flex flex-col gap-5">
      <app-admin-input
        label="Judul"
        id="title"
        [control]="titleControl"
        placeholder="e.g. Promo Merdeka">
      </app-admin-input>

      <app-admin-input
        label="Subjudul"
        id="subtitle"
        [control]="subtitleControl"
        placeholder="e.g. Diskon up to 70%">
      </app-admin-input>

      <app-admin-input
        label="URL Tujuan"
        id="targetUrl"
        [control]="targetUrlControl"
        placeholder="e.g. /products/promo">
      </app-admin-input>

      <app-admin-input
        label="Teks Tombol"
        id="buttonText"
        [control]="buttonTextControl"
        placeholder="e.g. Beli Sekarang">
      </app-admin-input>

      <div class="flex flex-col gap-2">
        <label class="font-semibold text-slate-700 text-sm">Status</label>
        <app-admin-checkbox label="Aktif" [control]="isActiveControl"></app-admin-checkbox>
      </div>

      <app-admin-input
        label="Urutan Tampil"
        id="displayOrder"
        type="number"
        [control]="displayOrderControl"
        placeholder="e.g. 1">
      </app-admin-input>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <app-admin-input
          label="Mulai Pada (Opsional)"
          id="startAt"
          type="datetime-local"
          [control]="startAtControl">
        </app-admin-input>

        <app-admin-input
          label="Berakhir Pada (Opsional)"
          id="endAt"
          type="datetime-local"
          [control]="endAtControl">
        </app-admin-input>
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-semibold text-slate-700 text-sm">Banner Image</label>
        <div class="flex items-start gap-4">
          @if (imageBase64Control.value) {
            <img [src]="imageBase64Control.value" alt="Banner Preview" class="w-32 h-16 rounded-lg object-cover border border-slate-200">
          } @else {
            <div class="w-32 h-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
              <span class="text-xs">No Image</span>
            </div>
          }
          <div class="flex-1">
            <input type="file" accept="image/*" (change)="onFileSelected($event)" class="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary-50 file:text-primary-700
              hover:file:bg-primary-100
            "/>
            <p class="text-xs text-slate-500 mt-1">Format: JPG, PNG. Max 2MB.</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="sticky -bottom-5 -mx-5 -mb-5 bg-white border-t border-slate-100 px-5 py-4 flex justify-end gap-3 mt-4 z-10">
        <app-admin-button type="button" variant="outline" (click)="onCancel.emit()">Batalkan</app-admin-button>
        <app-admin-button type="submit" variant="primary" [disabled]="bannerForm.invalid || bannerStore.loading()">
          {{ bannerStore.loading() ? 'Menyimpan...' : 'Simpan' }}
        </app-admin-button>
      </div>
    </form>
  `
})
export class PromotionBannersFormComponent {
  readonly banner = input<PromotionBanner | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  protected readonly bannerStore = inject(PromotionBannerStore);
  private readonly alertService = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  titleControl = new FormControl('', [Validators.required]);
  subtitleControl = new FormControl('', [Validators.required]);
  targetUrlControl = new FormControl('', [Validators.required]);
  buttonTextControl = new FormControl('', [Validators.required]);
  imageBase64Control = new FormControl('', [Validators.required]);
  isActiveControl = new FormControl(true);
  displayOrderControl = new FormControl(0, [Validators.required, Validators.min(0)]);
  startAtControl = new FormControl('');
  endAtControl = new FormControl('');

  bannerForm = new FormGroup({
    title: this.titleControl,
    subtitle: this.subtitleControl,
    targetUrl: this.targetUrlControl,
    buttonText: this.buttonTextControl,
    imageBase64: this.imageBase64Control,
    isActive: this.isActiveControl,
    displayOrder: this.displayOrderControl,
    startAt: this.startAtControl,
    endAt: this.endAtControl
  });

  constructor() {
    effect(() => {
      const b = this.banner();
      if (b) {
        this.titleControl.setValue(b.title);
        this.subtitleControl.setValue(b.subtitle);
        this.targetUrlControl.setValue(b.targetUrl);
        this.buttonTextControl.setValue(b.buttonText);
        this.imageBase64Control.setValue(b.imageBase64);
        this.isActiveControl.setValue(b.isActive);
        this.displayOrderControl.setValue(b.displayOrder);

        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        const formatDateTimeLocal = (dateStr?: string) => dateStr ? new Date(dateStr).toISOString().slice(0, 16) : '';
        this.startAtControl.setValue(formatDateTimeLocal(b.startAt));
        this.endAtControl.setValue(formatDateTimeLocal(b.endAt));
      } else {
        this.bannerForm.reset({ title: '', subtitle: '', targetUrl: '', buttonText: '', imageBase64: '', isActive: true, displayOrder: 0, startAt: '', endAt: '' });
      }
    });
  }

  selectedImageFile: File | null = null;

  async onSubmitForm() {
    if (this.bannerForm.invalid) {
      this.bannerForm.markAllAsTouched();
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Banner?',
      'Apakah Anda yakin ingin menyimpan perubahan data banner ini?'
    );
    if (!isConfirmed) return;

    const data: CreatePromotionBannerRequest = {
      title: this.titleControl.value || '',
      subtitle: this.subtitleControl.value || '',
      targetUrl: this.targetUrlControl.value || '',
      buttonText: this.buttonTextControl.value || '',
      imageBase64: this.imageBase64Control.value || '',
      isActive: this.isActiveControl.value ?? true,
      displayOrder: this.displayOrderControl.value || 0,
      startAt: this.startAtControl.value ? new Date(this.startAtControl.value).toISOString() : null,
      endAt: this.endAtControl.value ? new Date(this.endAtControl.value).toISOString() : null
    };

    if (this.banner() && this.banner()!.id) {
      await this.bannerStore.saveBanner(data as UpdatePromotionBannerRequest, this.banner()!.id, this.selectedImageFile || undefined, { showToast: false });
    } else {
      await this.bannerStore.saveBanner(data, undefined, this.selectedImageFile || undefined, { showToast: false });
    }
    this.alertService.success('Berhasil!', 'Data banner berhasil disimpan.');
    this.onSave.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imageBase64Control.setValue(reader.result as string);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }
}
