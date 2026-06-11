import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductStore } from '../../../store/product.store';
import { Category } from '../../../core/models';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../core/services/alert.service';
import { createClientPagination } from '../../../shared/util/pagination.util';

@Component({
  selector: 'app-categories-crud',
  standalone: true,
  imports: [ReactiveFormsModule, TableComponent, ModalComponent, InputComponent, ButtonComponent, IconComponent, PaginationComponent],
  templateUrl: './categories-crud.component.html',
  styleUrl: './categories-crud.component.css'
})
export class CategoriesCrudComponent implements OnInit {
  protected readonly productStore = inject(ProductStore);
  private readonly alertService = inject(AlertService);

  protected readonly pagination = createClientPagination(this.productStore.categories, 10);

  ngOnInit() {
    this.productStore.loadCategories();
  }

  isModalOpen = signal<boolean>(false);
  editCategory = signal<Category | null>(null);

  nameControl = new FormControl('', [Validators.required]);
  iconControl = new FormControl('book-open', [Validators.required]);

  categoryForm = new FormGroup({
    name: this.nameControl,
    icon: this.iconControl
  });

  openAddModal() {
    this.editCategory.set(null);
    this.categoryForm.reset({ name: '', icon: 'book-open' });
    this.isModalOpen.set(true);
  }

  openEditModal(category: Category) {
    this.editCategory.set(category);
    this.nameControl.setValue(category.name);
    this.iconControl.setValue(category.icon);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
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
      id: this.editCategory()?.id || '',
      name: this.nameControl.value || '',
      slug: this.editCategory()?.slug || '',
      icon: this.iconControl.value || 'book-open'
    };

    await this.productStore.saveCategory(cData);
    this.closeModal();
    this.alertService.success('Berhasil!', 'Data kategori berhasil disimpan.');
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Kategori?',
      'Apakah Anda yakin ingin menghapus kategori ini? Asosiasi produk dengan kategori ini akan dihapus.'
    );
    if (isConfirmed) {
      await this.productStore.deleteCategory(id);
      this.alertService.success('Berhasil!', 'Kategori telah berhasil dihapus.');
    }
  }
}
