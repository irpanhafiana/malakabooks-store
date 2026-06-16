import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  readonly isOpen = model<boolean>(false);
  readonly title = input<string>('');
  readonly hasFooter = input<boolean>(true);

  close() {
    this.isOpen.set(false);
  }
}
