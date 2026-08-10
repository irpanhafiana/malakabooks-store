import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (text()) {
      <div class="absolute z-9999 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 rounded shadow-lg pointer-events-none whitespace-nowrap"
           [ngStyle]="{ top: top() + 'px', left: left() + 'px' }"
           @tooltipAnimation>
        {{ text() }}
        <!-- arrow -->
        <div class="absolute w-2 h-2 bg-slate-800 transform rotate-45"
             style="bottom: -4px; left: 50%; margin-left: -4px;"></div>
      </div>
    }
  `,
  animations: [
    trigger('tooltipAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(4px)' }))
      ])
    ])
  ]
})
export class TooltipComponent {
  text = signal('');
  top = signal(0);
  left = signal(0);
}
