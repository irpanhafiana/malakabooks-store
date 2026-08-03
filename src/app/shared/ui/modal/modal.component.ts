import { Component, input, model, ChangeDetectionStrategy, ElementRef, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

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

  private readonly el = inject(ElementRef);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
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
    // Bersihkan DOM saat komponen dihancurkan
    this.el.nativeElement.remove();
    document.body.classList.remove('overflow-hidden');
  }

  close() {
    this.isOpen.set(false);
  }
}
