import { Component, input, output, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { readFileAsBase64, resolveImageUrl } from '../../util/image.util';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-image-uploader',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="flex flex-col gap-1.5 w-full">
      @if (label()) {
        <span class="text-xs font-semibold text-slate-700 font-display">{{ label() }}</span>
      }

      <div
        (click)="fileInput.click()"
        (keydown.enter)="fileInput.click()"
        tabindex="0"
        role="button"
        (dragover)="$event.preventDefault()"
        (drop)="onDrop($event)"
        class="relative flex flex-col items-center justify-center min-h-[140px] p-4 bg-slate-50 hover:bg-slate-100/80 border-2 border-dashed border-slate-200 hover:border-primary-400 rounded-2xl cursor-pointer transition-all group overflow-hidden"
      >
        <input
          #fileInput
          type="file"
          [accept]="accept()"
          (change)="onFileSelected($event)"
          class="hidden"
        >

        @if (previewUrl()) {
          <div class="relative w-full h-32 flex items-center justify-center rounded-xl overflow-hidden group">
            <img [src]="resolvedPreview" alt="Preview" class="max-h-full max-w-full object-contain rounded-lg shadow-xs">
            <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
              <span class="text-white text-xs font-bold bg-slate-900/80 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <app-icon name="edit" size="14"></app-icon> Ubah
              </span>
              <button
                type="button"
                (click)="removeImage($event)"
                class="text-rose-600 bg-white hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                title="Hapus"
              >
                <app-icon name="trash" size="14"></app-icon>
              </button>
            </div>
          </div>
        } @else {
          <div class="flex flex-col items-center gap-2 text-slate-400 group-hover:text-primary-500 transition-colors py-3">
            <div class="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200/60 flex items-center justify-center group-hover:scale-110 transition-transform">
              <app-icon name="upload" size="18"></app-icon>
            </div>
            <div class="text-center">
              <p class="text-xs font-semibold text-slate-600 group-hover:text-primary-600 transition-colors">Klik untuk mengunggah gambar</p>
              <p class="text-[10px] text-slate-400">PNG, JPG, WEBP hingga {{ maxSizeMb() }}MB</p>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ImageUploaderComponent {
  readonly value = input<string | null>(null);
  readonly label = input<string>('');
  readonly accept = input<string>('image/png, image/jpeg, image/webp');
  readonly maxSizeMb = input<number>(5);

  readonly valueChange = output<string | null>();
  readonly fileChange = output<File | null>();

  private readonly logger = inject(LoggerService);

  protected readonly previewUrl = signal<string | null>(null);

  constructor() {
    // Sync external value to previewUrl
  }

  protected get resolvedPreview(): string {
    const val = this.value() || this.previewUrl();
    return resolveImageUrl(val);
  }

  protected async onFileSelected(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    if (!inputEl.files || !inputEl.files[0]) return;
    await this.processFile(inputEl.files[0]);
  }

  protected async onDrop(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer?.files || !event.dataTransfer.files[0]) return;
    await this.processFile(event.dataTransfer.files[0]);
  }

  private async processFile(file: File) {
    if (file.size > this.maxSizeMb() * 1024 * 1024) {
      this.logger.warn(`Ukuran file melebihi batas ${this.maxSizeMb()}MB`);
      return;
    }
    try {
      const base64 = await readFileAsBase64(file);
      this.previewUrl.set(base64);
      this.valueChange.emit(base64);
      this.fileChange.emit(file);
    } catch (err) {
      this.logger.error('Gagal membaca berkas gambar:', err);
    }
  }

  protected removeImage(event: Event) {
    event.stopPropagation();
    this.previewUrl.set(null);
    this.valueChange.emit(null);
    this.fileChange.emit(null);
  }
}
