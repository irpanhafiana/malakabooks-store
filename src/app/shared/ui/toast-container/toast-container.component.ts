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
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css'
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
