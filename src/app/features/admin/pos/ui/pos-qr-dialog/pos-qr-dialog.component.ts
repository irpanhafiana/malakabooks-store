import { Component, input, output, signal, viewChild, ElementRef, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { PosButtonComponent } from '../pos-button/pos-button.component';
import { PosInputComponent } from '../pos-input/pos-input.component';

/**
 * Dialog scan QR pesanan B2C.
 *
 * Bukan pemindai kamera: input teks yang di-autofocus, mengandalkan scanner
 * fisik yang beremulasi keyboard. Enter memproses, Escape menutup.
 */
@Component({
  selector: 'app-pos-qr-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, PosButtonComponent, PosInputComponent],
  templateUrl: './pos-qr-dialog.component.html'
})
export class PosQrDialogComponent {
  isOpen = input<boolean>(false);
  onProcess = output<string>();
  onClose = output<void>();

  qrInputRef = viewChild<ElementRef<HTMLElement>>('qrInput');

  inputValue = signal('');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.inputValue.set('');
        setTimeout(() => {
          const inputEl = this.qrInputRef()?.nativeElement?.querySelector('input');
          if (inputEl) inputEl.focus();
        }, 100);
      }
    });
  }

  handleProcess() {
    const val = this.inputValue().trim();
    if (val) {
      this.onProcess.emit(val);
      this.inputValue.set('');
    }
  }

  handleClose() {
    this.inputValue.set('');
    this.onClose.emit();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.handleProcess();
    } else if (event.key === 'Escape') {
      this.handleClose();
    }
  }
}
