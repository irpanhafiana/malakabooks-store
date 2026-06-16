import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  readonly hoverable = input<boolean>(false);
  readonly hasHeader = input<boolean>(false);
  readonly hasFooter = input<boolean>(false);
  readonly customClass = input<string>('', { alias: 'class' });

  readonly cardClass = computed(() => {
    const base = 'bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-200';
    const hover = this.hoverable() ? 'hover:shadow-md hover:border-slate-200/80 hover:-translate-y-0.5' : '';
    return `${base} ${hover} ${this.customClass()}`;
  });
}
