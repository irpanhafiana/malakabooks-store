import { Component, input, output, computed } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
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
