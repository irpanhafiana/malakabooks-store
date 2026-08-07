import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-katalog-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './katalog-confirm-dialog.component.html'
})
export class KatalogConfirmDialogComponent {
  show = input<boolean>(false);
  title = input<string>('Konfirmasi');
  message = input<string>('Apakah Anda yakin?');
  messageHtml = input<string>('');
  confirmText = input<string>('Ya');
  cancelText = input<string>('Batal');
  type = input<'info' | 'danger' | 'warning'>('info');

  confirmClick = output<void>();
  cancelClick = output<void>();

  getIconBgClass(): string {
    switch (this.type()) {
      case 'danger': return 'bg-red-50 border-red-100';
      case 'warning': return 'bg-orange-50 border-orange-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  }

  getIconColorClass(): string {
    switch (this.type()) {
      case 'danger': return 'text-red-500';
      case 'warning': return 'text-orange-500';
      default: return 'text-primary-600';
    }
  }

  getIconClass(): string {
    switch (this.type()) {
      case 'danger': return 'bx-trash';
      case 'warning': return 'bx-error';
      default: return 'bx-question-mark';
    }
  }

  getConfirmBtnClass(): string {
    switch (this.type()) {
      case 'danger': return 'bg-red-500 border-red-600';
      case 'warning': return 'bg-orange-500 border-orange-600';
      default: return 'bg-primary-600 border-primary-700';
    }
  }
}
