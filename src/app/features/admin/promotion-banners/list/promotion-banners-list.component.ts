import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PromotionBannerStore } from '../../../../store/promotion-banner.store';
import { PromotionBanner } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { PromotionBannersFormComponent } from '../form/promotion-banners-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { NgClass } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-promotion-banners-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, PromotionBannersFormComponent, SpinnerComponent, NgClass],
  templateUrl: './promotion-banners-list.component.html'
})
export class PromotionBannersListComponent implements OnInit {
  protected readonly bannerStore = inject(PromotionBannerStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredBanners = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const banners = this.bannerStore.banners() || [];
    if (!query) return banners;
    return banners.filter(b => b.title.toLowerCase().includes(query) || b.subtitle.toLowerCase().includes(query));
  });

  protected readonly pagination = createClientPagination(this.filteredBanners, 10);

  isModalOpen = signal<boolean>(false);
  editBanner = signal<PromotionBanner | null>(null);

  ngOnInit() {
    this.bannerStore.loadAdminBanners();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editBanner.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(banner: PromotionBanner) {
    this.editBanner.set(banner);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Banner?',
      'Apakah Anda yakin ingin menghapus promotion banner ini?'
    );
    if (isConfirmed) {
      await this.bannerStore.deleteBanner(id);
      this.alertService.success('Berhasil!', 'Promosi telah berhasil dihapus.');
    }
  }

  onRefresh() {
    this.bannerStore.loadAdminBanners();
  }
}