import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Global toast outlet. Renders the ToastService queue.
 *
 * Extracted from the customer layout so it can be shared. The admin layout
 * previously rendered no outlet at all, which meant every store-level toast
 * fired from admin (load failures, save confirmations, status-update errors)
 * was silently dropped.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div
      class="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 z-[60] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [class]="toastClass(toast.type)"
          class="flex items-center gap-2.5 p-3 rounded-xl shadow-md border bg-white animate-slide-down transition-all pointer-events-auto"
          role="status"
        >
          @if (toast.type === 'success') {
            <i class="bx bx-check text-emerald-500 text-sm"></i>
          } @else if (toast.type === 'error') {
            <i class="bx bx-error-circle text-rose-500 text-sm"></i>
          } @else if (toast.type === 'warning') {
            <i class="bx bx-error text-amber-500 text-sm"></i>
          } @else {
            <i class="bx bx-info-circle text-blue-500 text-sm"></i>
          }
          <span class="text-[11px] font-semibold text-slate-800 flex-1">{{ toast.message }}</span>
          <button
            type="button"
            (click)="toastService.remove(toast.id)"
            aria-label="Dismiss notification"
            class="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <i class="bx bx-x text-xs"></i>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected toastClass(type: string): string {
    const borderType: Record<string, string> = {
      success: 'border-l-4 border-l-emerald-500 shadow-emerald-500/5 shadow-md',
      error: 'border-l-4 border-l-rose-500 shadow-rose-500/5 shadow-md',
      info: 'border-l-4 border-l-blue-500 shadow-blue-500/5 shadow-md',
      warning: 'border-l-4 border-l-amber-500 shadow-amber-500/5 shadow-md'
    };
    return borderType[type] || 'border-l-4 border-l-blue-500';
  }
}
