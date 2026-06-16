import { Component, input, ContentChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './masonry-grid.component.html',
  styleUrl: './masonry-grid.component.css'
})
export class MasonryGridComponent {
  items = input<any[]>([]);

  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<any>;

  trackById(item: any): any {
    return item?.id || item?.product?.id || item;
  }
}
