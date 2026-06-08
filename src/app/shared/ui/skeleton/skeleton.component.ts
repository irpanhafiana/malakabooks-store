import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="flex flex-col gap-3.5 w-full">
      @for (item of items(); track $index) {
        @if (type() === 'card') {
          <div class="border border-slate-100 rounded-2xl p-4 w-full bg-white flex flex-col gap-3">
            <div class="aspect-square w-full bg-slate-200/60 rounded-xl animate-pulse"></div>
            <div class="h-4 bg-slate-200/60 rounded animate-pulse w-3/4"></div>
            <div class="h-3 bg-slate-200/60 rounded animate-pulse w-1/2"></div>
            <div class="flex justify-between items-center mt-2">
              <div class="h-6 bg-slate-200/60 rounded animate-pulse w-1/3"></div>
              <div class="h-8 w-8 bg-slate-200/60 rounded-lg animate-pulse"></div>
            </div>
          </div>
        } @else if (type() === 'avatar') {
          <div class="rounded-full bg-slate-200/60 animate-pulse" [style.width]="size()" [style.height]="size()"></div>
        } @else if (type() === 'table-row') {
          <div class="flex items-center gap-4 py-4 border-b border-slate-100 w-full">
            <div class="h-4 bg-slate-200/60 rounded animate-pulse w-1/6"></div>
            <div class="h-4 bg-slate-200/60 rounded animate-pulse w-2/6"></div>
            <div class="h-4 bg-slate-200/60 rounded animate-pulse w-1/6"></div>
            <div class="h-4 bg-slate-200/60 rounded animate-pulse w-1/6"></div>
            <div class="h-6 w-12 bg-slate-200/60 rounded animate-pulse ml-auto"></div>
          </div>
        } @else {
          <div class="bg-slate-200/60 rounded animate-pulse" [style.height]="height()" [style.width]="width()"></div>
        }
      }
    </div>
  `
})
export class SkeletonComponent {
  readonly type = input<'text' | 'avatar' | 'card' | 'table-row'>('text');
  readonly count = input<number>(1);
  readonly width = input<string>('100%');
  readonly height = input<string>('16px');
  readonly size = input<string>('48px'); // used for avatar dimensions

  readonly items = computed(() => Array(this.count()).fill(0));
}
