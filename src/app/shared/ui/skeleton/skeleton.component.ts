import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.css'
})
export class SkeletonComponent {
  readonly type = input<'text' | 'avatar' | 'card' | 'table-row' | 'horizontal-card'>('text');
  readonly count = input<number>(1);
  readonly width = input<string>('100%');
  readonly height = input<string>('16px');
  readonly size = input<string>('48px'); // used for avatar dimensions

  readonly items = computed(() => Array(this.count()).fill(0));
}
