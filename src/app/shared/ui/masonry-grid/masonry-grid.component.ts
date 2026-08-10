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
  items = input<unknown[]>([]);

  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<unknown>;

  trackById(item: unknown): unknown {
    const it = item as { id?: unknown; product?: { id?: unknown } } | null;
    return it?.id || it?.product?.id || item;
  }
}
