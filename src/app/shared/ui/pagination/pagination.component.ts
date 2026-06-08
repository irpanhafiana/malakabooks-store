import { Component, input, output, computed } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-center gap-1.5 mt-6">
        <!-- Prev Button -->
        <button
          type="button"
          [disabled]="currentPage() === 1"
          (click)="changePage(currentPage() - 1)"
          class="p-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white active:scale-95 cursor-pointer transition-all"
        >
          <app-icon name="chevron-left" size="16"></app-icon>
        </button>

        <!-- Page Numbers -->
        @for (page of pages(); track $index) {
          @if (page === -1) {
            <span class="px-2 text-slate-400 text-sm font-semibold">...</span>
          } @else {
            <button
              type="button"
              (click)="changePage(page)"
              [class]="pageButtonClass(page)"
            >
              {{ page }}
            </button>
          }
        }

        <!-- Next Button -->
        <button
          type="button"
          [disabled]="currentPage() === totalPages()"
          (click)="changePage(currentPage() + 1)"
          class="p-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white active:scale-95 cursor-pointer transition-all"
        >
          <app-icon name="chevron-right" size="16"></app-icon>
        </button>
      </div>
    }
  `
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  // Computes which pages to display, including ellipsis breakpoints
  readonly pages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const visiblePages: number[] = [];
    visiblePages.push(1);

    if (current > 3) {
      visiblePages.push(-1);
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }

    if (current < total - 2) {
      visiblePages.push(-1);
    }

    visiblePages.push(total);
    return visiblePages;
  });

  pageButtonClass(page: number): string {
    const base = 'h-9 w-9 flex items-center justify-center text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95 border';
    const active = page === this.currentPage()
      ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-800';
    return `${base} ${active}`;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
