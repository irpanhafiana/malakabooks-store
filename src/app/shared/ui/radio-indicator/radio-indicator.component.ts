import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-radio-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio-indicator.component.html'
})
export class RadioIndicatorComponent {
  readonly checked = input<boolean>(false);
}
