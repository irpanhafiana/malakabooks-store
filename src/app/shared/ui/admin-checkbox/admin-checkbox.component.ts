import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-checkbox',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-checkbox.component.html'
})
export class AdminCheckboxComponent {
  readonly control = input.required<FormControl>();
  readonly id = input<string>('admin-checkbox-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
}
