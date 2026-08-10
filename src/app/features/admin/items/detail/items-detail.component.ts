import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ItemApiService } from '../../../../core/services/item-api.service';
import { CatalogItem } from '../../../../core/models';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-items-detail',
  standalone: true,
  imports: [CommonModule, IconComponent, AdminButtonComponent, RouterLink],
  templateUrl: './items-detail.component.html'
})
export class ItemsDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly itemApi = inject(ItemApiService);

  item = signal<CatalogItem & any | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadItem(id);
    } else {
      this.error.set('ID Item tidak valid.');
      this.loading.set(false);
    }
  }

  async loadItem(id: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.itemApi.getItemById(id);
      if (data) {
        this.item.set(data);
      } else {
        this.error.set('Item tidak ditemukan.');
      }
    } catch {
      this.error.set('Terjadi kesalahan saat memuat item.');
    } finally {
      this.loading.set(false);
    }
  }
}
