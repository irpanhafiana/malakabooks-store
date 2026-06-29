import { Component, input, model, ChangeDetectionStrategy, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
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
  readonly hasFooter = input<boolean>(true);

  private readonly el = inject(ElementRef);

  ngOnInit() {
    // Pindahkan modal ke akhir tag <body> untuk menghindari masalah z-index & stacking context
    document.body.appendChild(this.el.nativeElement);
  }

  ngOnDestroy() {
    // Bersihkan DOM saat komponen dihancurkan
    this.el.nativeElement.remove();
  }

  close() {
    this.isOpen.set(false);
  }
}
