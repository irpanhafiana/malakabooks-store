import { Component, inject, OnInit, signal, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ItemStore } from '../../../../store/item.store';
import { CatalogItem } from '../../../../core/models';
import { ItemApiService } from '../../../../core/services/item-api.service';
import { ItemsFormComponent } from '../form/items-form.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-items-form-page',
  standalone: true,
  imports: [ItemsFormComponent, IconComponent, AdminButtonComponent],
  templateUrl: './items-form-page.component.html'
})
export class ItemsFormPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly itemStore = inject(ItemStore);
  private readonly itemApi = inject(ItemApiService);

  @ViewChild(ItemsFormComponent) itemsForm!: ItemsFormComponent;

  protected readonly editItem = signal<CatalogItem | null>(null);
  protected readonly isEditing = signal(false);
  protected selectedItemType = signal<string>('mardika');

  async ngOnInit() {
    this.itemStore.loadItems();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      
      const item = await this.itemApi.getItemById(id);
      if (item) {
        this.editItem.set(item);
        if (item.itemType) {
          this.selectedItemType.set(item.itemType);
        }
      }
    } else {
      this.isEditing.set(false);
      this.editItem.set(null);
    }
  }

  onCancel() {
    this.router.navigate(['/admin/items']);
  }

  onSave() {
    this.router.navigate(['/admin/items']);
  }


  onItemTypeChange(type: string) {
    this.selectedItemType.set(type);
  }
}
