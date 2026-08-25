import { Component, input, model, ChangeDetectionStrategy, ElementRef, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { lockBodyScroll, unlockBodyScroll } from '../../util/body-scroll-lock.util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent implements OnInit, OnDestroy {
  readonly isOpen = model<boolean>(false);
  readonly title = input<string>('');
  readonly showHeader = input<boolean>(true);
  readonly hasFooter = input<boolean>(true);
  readonly maxWidth = input<string>('max-w-lg');
  readonly noScroll = input<boolean>(false);
  readonly zIndex = input<string>('z-100');

  private readonly el = inject(ElementRef);
  private isCurrentlyLocked = false;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open && !this.isCurrentlyLocked) {
        this.isCurrentlyLocked = true;
        lockBodyScroll();
      } else if (!open && this.isCurrentlyLocked) {
        this.isCurrentlyLocked = false;
        unlockBodyScroll();
      }
    });
  }

  ngOnInit() {
    // Cari parent root class sebelum memindahkan elemen
    const parentRoot = this.el.nativeElement.closest('.admin-root, .customer-root, .inner-root');
    if (parentRoot) {
      if (parentRoot.classList.contains('admin-root')) this.el.nativeElement.classList.add('admin-root');
      if (parentRoot.classList.contains('customer-root')) this.el.nativeElement.classList.add('customer-root');
      if (parentRoot.classList.contains('inner-root')) this.el.nativeElement.classList.add('inner-root');
    }

    // Pindahkan modal ke akhir tag <body> untuk menghindari masalah z-index & stacking context
    document.body.appendChild(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.isCurrentlyLocked) {
      this.isCurrentlyLocked = false;
      unlockBodyScroll();
    }
    // Bersihkan DOM saat komponen dihancurkan
    this.el.nativeElement.remove();
  }

  close() {
    this.isOpen.set(false);
  }
}
