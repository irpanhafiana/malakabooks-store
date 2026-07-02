import { Component, input, computed, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-input',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './admin-input.component.html'
})
export class AdminInputComponent {
  @ViewChild('inputEl') private inputRef!: ElementRef<HTMLInputElement>;

  readonly control = input.required<FormControl>();
  readonly id = input<string>('admin-input-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  readonly icon = input<string | undefined>(undefined);
  readonly customClass = input<string>('', { alias: 'class' });
  readonly formatNumber = input<boolean>(false);

  // Compute styling based on states
  readonly inputClass = computed(() => {
    const base = 'block w-full border rounded-xl py-2.5 text-sm focus:outline-none focus:ring-1 placeholder-slate-400 text-slate-800 bg-white';
    const padding = this.icon() ? 'pl-9 pr-3' : 'px-3';

    const isError = this.control().invalid && (this.control().dirty || this.control().touched);
    const border = isError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-300 focus:border-slate-500 focus:ring-slate-500';

    return `${base} ${padding} ${border} ${this.customClass()}`;
  });

  /** Format raw digits → Indonesian thousand format (1000 → 1.000) */
  private formatThousand(val: string): string {
    const digits = val.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return parseInt(digits, 10).toLocaleString('id-ID');
  }

  onFocus() {
    if (!this.formatNumber()) return;
    const input = this.inputRef?.nativeElement;
    if (!input) return;
    // Save raw cursor position-based digit index
    this.restoreCursorPos = 0;
    input.value = input.value.replace(/\./g, '');
  }

  private restoreCursorPos = 0;

  onInput() {
    if (!this.formatNumber()) return;
    const input = this.inputRef?.nativeElement;
    if (!input) return;

    const raw = input.value.replace(/[^0-9]/g, '');
    if (!raw) return;

    const formatted = parseInt(raw, 10).toLocaleString('id-ID');
    if (formatted === input.value) return;

    // Calculate cursor position relative to digit count
    const cursorPos = input.selectionStart || 0;
    const digitsBeforeCursor = input.value.substring(0, cursorPos).replace(/[^0-9]/g, '').length;

    input.value = formatted;

    // Restore cursor after the same digit position in formatted string
    let newPos = 0;
    let digitsFound = 0;
    while (newPos < formatted.length && digitsFound < digitsBeforeCursor) {
      if (formatted[newPos] >= '0' && formatted[newPos] <= '9') digitsFound++;
      newPos++;
    }
    input.setSelectionRange(newPos, newPos);
  }
}
