import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../../core/models';
import { ProductStore } from '../../../../store/product.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-categories-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent],
  templateUrl: './categories-form.component.html',
  styleUrl: './categories-form.component.css'
})
export class CategoriesFormComponent {
  readonly category = input<Category | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  private readonly productStore = inject(ProductStore);
  private readonly alertService = inject(AlertService);

  nameControl = new FormControl('', [Validators.required]);
  iconControl = new FormControl('book-open', [Validators.required]);

  categoryForm = new FormGroup({
    name: this.nameControl,
    icon: this.iconControl
  });

  constructor() {
    effect(() => {
      const cat = this.category();
      if (cat) {
        this.nameControl.setValue(cat.name);
        this.iconControl.setValue(cat.icon);
      } else {
        this.categoryForm.reset({ name: '', icon: 'book-open' });
      }
    });
  }

  async onSubmitForm() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Kategori?',
      'Apakah Anda yakin ingin menyimpan perubahan data kategori ini?'
    );
    if (!isConfirmed) return;

    const cData: Category = {
      id: this.category()?.id || '',
      name: this.nameControl.value || '',
      slug: this.category()?.slug || '',
      icon: this.iconControl.value || 'book-open'
    };

    await this.productStore.saveCategory(cData);
    this.alertService.success('Berhasil!', 'Data kategori berhasil disimpan.');
    this.onSave.emit();
  }
}
