import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Author } from '../../../../core/models';
import { AuthorStore } from '../../../../store/author.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-authors-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent],
  template: `
    <form [formGroup]="authorForm" (ngSubmit)="onSubmitForm()" class="flex flex-col gap-5">
      <app-admin-input
        label="Author Name"
        id="name"
        [control]="nameControl"
        placeholder="e.g. Tere Liye">
      </app-admin-input>

      <app-admin-input
        label="Biography"
        id="biography"
        [control]="biographyControl"
        placeholder="Brief biography">
      </app-admin-input>

      <div class="flex flex-col gap-2">
        <label class="font-semibold text-slate-700 text-sm">Author Photo</label>
        <div class="flex items-start gap-4">
          @if (photoUrlControl.value) {
            <img [src]="photoUrlControl.value" alt="Photo Preview" class="w-16 h-16 rounded-lg object-cover border border-slate-200">
          } @else {
            <div class="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
              <span class="text-xs">No Photo</span>
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
      <div class="flex justify-end gap-3 mt-4">
        <app-admin-button type="button" variant="outline" (click)="onCancel.emit()">Cancel</app-admin-button>
        <app-admin-button type="submit" variant="primary" [disabled]="authorForm.invalid || authorStore.loading()">
          {{ authorStore.loading() ? 'Saving...' : 'Save Author' }}
        </app-admin-button>
      </div>
    </form>
  `
})
export class AuthorsFormComponent {
  author = input<Author | null>(null);
  onCancel = output<void>();
  onSave = output<void>();

  protected readonly authorStore = inject(AuthorStore);
  private readonly alertService = inject(AlertService);

  nameControl = new FormControl('', [Validators.required]);
  biographyControl = new FormControl('');
  photoUrlControl = new FormControl('');

  authorForm = new FormGroup({
    name: this.nameControl,
    biography: this.biographyControl,
    photoUrl: this.photoUrlControl
  });

  constructor() {
    effect(() => {
      const auth = this.author();
      if (auth) {
        this.nameControl.setValue(auth.name);
        this.biographyControl.setValue(auth.biography || '');
        this.photoUrlControl.setValue(auth.photoUrl || '');
      } else {
        this.authorForm.reset({ name: '', biography: '', photoUrl: '' });
      }
    });
  }

  async onSubmitForm() {
    if (this.authorForm.invalid) {
      this.authorForm.markAllAsTouched();
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Author?',
      'Apakah Anda yakin ingin menyimpan perubahan data author ini?'
    );
    if (!isConfirmed) return;

    const aData: Partial<Author> = {
      id: this.author()?.id,
      name: this.nameControl.value || '',
      biography: this.biographyControl.value || '',
      photoUrl: this.photoUrlControl.value || ''
    };

    await this.authorStore.saveAuthor(aData);
    this.alertService.success('Berhasil!', 'Data author berhasil disimpan.');
    this.onSave.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.photoUrlControl.setValue(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }
}
