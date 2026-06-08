import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div [class]="cardClass()">
      @if (hasHeader()) {
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="font-display font-semibold text-slate-800">
            <ng-content select="[card-title]"></ng-content>
          </div>
          <div>
            <ng-content select="[card-actions]"></ng-content>
          </div>
        </div>
      }
      <div class="p-5">
        <ng-content></ng-content>
      </div>
      @if (hasFooter()) {
        <div class="px-5 py-4 bg-slate-50/50 border-t border-slate-100/50 rounded-b-2xl">
          <ng-content select="[card-footer]"></ng-content>
        </div>
      }
    </div>
  `
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
