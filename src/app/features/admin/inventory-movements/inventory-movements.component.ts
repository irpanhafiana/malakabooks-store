import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { InventoryMovementStore } from '../../../store/inventory-movement.store';
import { ProductStore } from '../../../store/product.store';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { AdminButtonComponent } from '../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { createClientPagination } from '../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inventory-movements',
  standalone: true,
  imports: [CommonModule, TableComponent, AdminButtonComponent, IconComponent, PaginationComponent, SpinnerComponent],
  templateUrl: './inventory-movements.component.html'
})
export class InventoryMovementsComponent implements OnInit {
  protected readonly movementStore = inject(InventoryMovementStore);
  protected readonly productStore = inject(ProductStore);

  selectedBookId = signal<string>('');

  bookOptions = computed(() => {
    const list = this.productStore.products() || [];
    return [
      { id: '', title: '-- Semua Buku --' },
      ...list.map(p => ({ id: p.id, title: p.title }))
    ];
  });

  protected readonly pagination = createClientPagination(
    computed(() => this.movementStore.movements()),
    10
  );

  ngOnInit() {
    this.movementStore.loadInventoryMovements();
    this.productStore.loadProducts();
  }

  onBookChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const bookId = target.value;
    this.selectedBookId.set(bookId);
    this.movementStore.loadInventoryMovements(bookId || undefined);
    this.pagination.setPage(1);
  }

  onRefresh() {
    const bookId = this.selectedBookId();
    this.movementStore.loadInventoryMovements(bookId || undefined);
    this.productStore.loadProducts();
  }
}
