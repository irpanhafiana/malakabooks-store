import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InventoryMovementStore } from '../../../store/inventory-movement.store';
import { ItemStore } from '../../../store/item.store';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { AdminButtonComponent } from '../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { createClientPagination } from '../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { AdminInputComponent } from '../../../shared/ui/admin-input/admin-input.component';
import { AdminSelectComponent } from '../../../shared/ui/admin-select/admin-select.component';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inventory-movements',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    TableComponent, 
    AdminButtonComponent, 
    IconComponent, 
    PaginationComponent, 
    SpinnerComponent,
    ModalComponent,
    AdminInputComponent,
    AdminSelectComponent
  ],
  templateUrl: './inventory-movements.component.html'
})
export class InventoryMovementsComponent implements OnInit {
  protected readonly movementStore = inject(InventoryMovementStore);
  protected readonly itemStore = inject(ItemStore);

  selectedItemId = signal<string>('');
  filterControl = new FormControl('');
  isModalOpen = signal<boolean>(false);

  private readonly fb = inject(FormBuilder);
  
  mutationForm: FormGroup = this.fb.group({
    itemId: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(1)]],
    referenceId: [''],
    note: ['', Validators.required]
  });

  productOptions = computed(() => {
    const list = this.itemStore.items() || [];
    return list.map(p => ({ value: p.id, label: p.name }));
  });

  itemOptions = computed(() => {
    const list = this.itemStore.items() || [];
    return [
      { value: '', label: '-- Semua Item --' },
      ...list.map(p => ({ value: p.id, label: p.name }))
    ];
  });

  protected readonly pagination = createClientPagination(
    computed(() => this.movementStore.movements()),
    10
  );

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.movementStore.loadInventoryMovements();
    this.itemStore.loadItems();

    this.filterControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      this.selectedItemId.set(val || '');
      this.movementStore.loadInventoryMovements(val || undefined);
      this.pagination.setPage(1);
    });
  }

  onItemChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const itemId = target.value;
    this.selectedItemId.set(itemId);
    this.movementStore.loadInventoryMovements(itemId || undefined);
    this.pagination.setPage(1);
  }

  onRefresh() {
    const itemId = this.filterControl.value;
    this.movementStore.loadInventoryMovements(itemId || undefined);
    this.itemStore.loadItems();
  }

  openAddModal() {
    this.mutationForm.reset({ quantity: 0, referenceId: '', note: '', itemId: '' });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async submitMutation() {
    if (this.mutationForm.invalid) {
      this.mutationForm.markAllAsTouched();
      return;
    }

    const value = this.mutationForm.value;
    const success = await this.movementStore.receiveGoods(value);
    
    if (success) {
      this.closeModal();
    }
  }
}

