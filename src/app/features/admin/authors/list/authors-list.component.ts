import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AuthorStore } from '../../../../store/author.store';
import { Author } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { AuthorsFormComponent } from '../form/authors-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

import { AdminSearchInputComponent } from '../../../../shared/ui/admin-search-input/admin-search-input.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-authors-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, AuthorsFormComponent, SpinnerComponent, TooltipDirective, AdminSearchInputComponent],
  templateUrl: './authors-list.component.html'
})
export class AuthorsListComponent implements OnInit {
  protected readonly authorStore = inject(AuthorStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredAuthors = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const authors = this.authorStore.authors() || [];
    if (!query) return authors;
    return authors.filter(a => a.name.toLowerCase().includes(query));
  });

  protected readonly pagination = createClientPagination(this.filteredAuthors, 10);

  isModalOpen = signal<boolean>(false);
  editAuthor = signal<Author | null>(null);

  ngOnInit() {
    this.authorStore.loadAuthors();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editAuthor.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(author: Author) {
    this.editAuthor.set(author);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Author?',
      'Apakah Anda yakin ingin menghapus author ini?'
    );
    if (isConfirmed) {
      await this.authorStore.deleteAuthor(id, { showToast: false });
      this.alertService.success('Berhasil!', 'Author telah berhasil dihapus.');
    }
  }

  onRefresh() {
    this.authorStore.loadAuthors();
  }
}