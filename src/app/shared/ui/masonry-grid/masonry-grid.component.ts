import { Component, input, computed, ContentChild, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="grid grid-cols-2 gap-4 items-start w-full">
      <!-- Left Column -->
      <div class="flex flex-col gap-4">
        @for (item of leftColumnItems(); track trackById(item)) {
          <ng-container [ngTemplateOutlet]="itemTemplate" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
        }
      </div>
      <!-- Right Column -->
      <div class="flex flex-col gap-4">
        @for (item of rightColumnItems(); track trackById(item)) {
          <ng-container [ngTemplateOutlet]="itemTemplate" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
        }
      </div>
    </div>
  `
})
export class MasonryGridComponent {
  items = input<any[]>([]);

  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<any>;

  leftColumnItems = computed(() => {
    return this.items().filter((_, index) => index % 2 === 0);
  });

  rightColumnItems = computed(() => {
    return this.items().filter((_, index) => index % 2 !== 0);
  });

  trackById(item: any): any {
    return item?.id || item?.product?.id || item;
  }
}
