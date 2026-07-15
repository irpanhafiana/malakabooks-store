import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { UserStore } from '../../../../store/user.store';
import { User } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-list',
  standalone: true,
  imports: [TableComponent, BadgeComponent, AdminButtonComponent, DatePipe, UpperCasePipe, PaginationComponent, SpinnerComponent, IconComponent, TooltipDirective],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {
  protected readonly userStore = inject(UserStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const users = this.userStore.users();
    if (!query) return users;
    return users.filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
  });

  protected readonly pagination = createClientPagination(this.filteredUsers, 10);

  ngOnInit() {
    this.userStore.loadUsers();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pagination.setPage(1);
  }

  async toggleRole(user: User) {
    const newRole: 'customer' | 'admin' = user.role === 'admin' ? 'customer' : 'admin';
    
    const isConfirmed = await this.alertService.confirm(
      'Ubah Peran Pengguna?',
      `Apakah Anda yakin ingin mengubah peran "${user.name}" menjadi ${newRole.toUpperCase()}?`
    );
    if (!isConfirmed) return;

    const updatedUser = { ...user, role: newRole };
    try {
      await this.userStore.saveUser(updatedUser);
      this.alertService.success('Berhasil!', `Peran pengguna "${user.name}" berhasil diubah menjadi ${newRole.toUpperCase()}.`);
    } catch (e) {
      this.alertService.error('Gagal!', 'Gagal mengubah peran pengguna.');
    }
  }

  onRefresh() {
    this.userStore.loadUsers();
  }
}