import { Component, input, computed, ContentChild, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './masonry-grid.component.html',
  styleUrl: './masonry-grid.component.css'
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
