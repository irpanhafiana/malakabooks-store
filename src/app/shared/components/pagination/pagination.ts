import { Component, Input, Output, EventEmitter, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html'
})
export class PaginationComponent {
  @Input() currentPage = 1;

  private readonly _totalPages = signal(1);

  @Input() set totalPages(value: number) {
    this._totalPages.set(value);
  }
  get totalPages(): number {
    return this._totalPages();
  }

  @Output() pageChange = new EventEmitter<number>();

  pagesArray = computed(() => {
    const list: number[] = [];
    for (let i = 1; i <= this._totalPages(); i++) {
      list.push(i);
    }
    return list;
  });

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}
