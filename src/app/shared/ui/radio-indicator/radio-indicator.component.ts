import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-radio-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="h-5 w-5 rounded-full border bg-white  flex items-center justify-center shrink-0"
      [class.border-primary-600]="checked()"
      [class.border-slate-200]="!checked()">
      <div 
        class="h-2.5 w-2.5 rounded-full bg-primary-600  "
        [class.scale-100]="checked()"
        [class.scale-0]="!checked()">
      </div>
    </div>
  `
})
export class RadioIndicatorComponent {
  readonly checked = input<boolean>(false);
}
