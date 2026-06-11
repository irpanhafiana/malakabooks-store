import { Component, input, model } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
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
