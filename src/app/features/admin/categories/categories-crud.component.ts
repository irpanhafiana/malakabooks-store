import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductStore } from '../../../store/product.store';
import { Category } from '../../../core/models';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-categories-crud',
  standalone: true,
  imports: [ReactiveFormsModule, TableComponent, ModalComponent, InputComponent, ButtonComponent, IconComponent],
  template: `
    <div class="animate-fade-in flex flex-col gap-6">
      
      <!-- Top Action bar -->
      <div class="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
        <h2 class="font-display font-bold text-slate-800 text-sm">Categories Manager</h2>

        <app-button (click)="openAddModal()" variant="primary" size="sm">
          <app-icon name="plus" size="14"></app-icon>
          Add Category
        </app-button>
      </div>

      <!-- Data Table -->
      @if (productStore.loading()) {
        <div class="p-8 text-center text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100 shadow-xs">Loading categories...</div>
      } @else {
        <app-table>
          <tr table-headers>
            <th class="px-5 py-3">Category Name</th>
            <th class="px-5 py-3">Slug</th>
            <th class="px-5 py-3">Icon Name</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>

          <ng-container table-rows>
            @for (cat of productStore.categories(); track cat.id) {
              <tr class="hover:bg-slate-50/30">
                <td class="px-5 py-4 font-bold text-slate-800 text-xs">
                  <div class="flex items-center gap-3">
                    <div class="p-1.5 bg-slate-50 text-slate-500 rounded-lg">
                      <app-icon [name]="cat.icon" size="16"></app-icon>
                    </div>
                    <span>{{ cat.name }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-xs font-semibold text-slate-500">{{ cat.slug }}</td>
                <td class="px-5 py-4 text-xs text-slate-500">
                  <code class="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-primary-600 font-mono">{{ cat.icon }}</code>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="flex justify-end gap-1.5">
                    <button (click)="openEditModal(cat)" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
                      <app-icon name="edit" size="14"></app-icon>
                    </button>
                    <button (click)="onDelete(cat.id)" class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
                      <app-icon name="trash" size="14"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="p-8 text-center text-slate-400">No categories found.</td>
              </tr>
            }
          </ng-container>
        </app-table>
      }

      <!-- Add/Edit Category Modal Form -->
      <app-modal [isOpen]="isModalOpen()" [title]="editCategory() ? 'Edit Category' : 'Add New Category'" [hasFooter]="true">
        <form [formGroup]="categoryForm" class="flex flex-col gap-4">
          <app-input label="Category Name" placeholder="e.g. Literature & Fiction" [control]="nameControl"></app-input>
          <app-input label="Icon Name (e.g. book-open, cpu, pen-tool, headphones, tablet)" placeholder="book-open" [control]="iconControl"></app-input>
        </form>

        <ng-container modal-footer>
          <app-button (click)="closeModal()" variant="outline" size="sm">Cancel</app-button>
          <app-button (click)="onSubmitForm()" [disabled]="categoryForm.invalid" variant="primary" size="sm">Save Category</app-button>
        </ng-container>
      </app-modal>

    </div>
  `
})
export class CategoriesCrudComponent {
  protected readonly productStore = inject(ProductStore);

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
    if (this.categoryForm.invalid) return;

    const cData: Category = {
      id: this.editCategory()?.id || '',
      name: this.nameControl.value || '',
      slug: this.editCategory()?.slug || '',
      icon: this.iconControl.value || 'book-open'
    };

    await this.productStore.saveCategory(cData);
    this.closeModal();
  }

  async onDelete(id: string) {
    if (confirm('Are you sure you want to delete this category? All products under it will remain but its category association will be deleted.')) {
      await this.productStore.deleteCategory(id);
    }
  }
}
