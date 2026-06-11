import { Component, input, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-radio',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.css'
})
export class RadioComponent {
  readonly control = input.required<FormControl>();
  readonly options = input.required<{ value: any; label: string }[]>();
  readonly name = input<string>('radio-group-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly direction = input<'row' | 'col'>('col');

  readonly directionClass = computed(() => {
    return this.direction() === 'row' ? 'flex flex-row flex-wrap gap-6' : 'flex flex-col gap-3.5';
  });
}
