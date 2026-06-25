import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { UserApiService } from '../../../core/services/user-api.service';
import { User } from '../../../core/models';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { AdminButtonComponent } from '../../../shared/ui/admin-button/admin-button.component';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { AlertService } from '../../../core/services/alert.service';
import { createClientPagination } from '../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-crud',
  standalone: true,
  imports: [TableComponent, BadgeComponent, AdminButtonComponent, DatePipe, UpperCasePipe, PaginationComponent, SpinnerComponent],
  templateUrl: './users-crud.component.html',
  styleUrl: './users-crud.component.css'
})
export class UsersCrudComponent implements OnInit {
  private readonly userApi = inject(UserApiService);
  private readonly toastService = inject(ToastService);
  private readonly alertService = inject(AlertService);

  usersList = signal<User[]>([]);
  loading = signal<boolean>(true);

  protected readonly pagination = createClientPagination(this.usersList, 10);

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const users = await this.userApi.getUsers();
      this.usersList.set(users);
    } catch (e) {
      this.toastService.error('Failed to load user accounts.');
    } finally {
      this.loading.set(false);
    }
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
      await this.userApi.saveUser(updatedUser);
      this.alertService.success('Berhasil!', `Peran pengguna "${user.name}" berhasil diubah menjadi ${newRole.toUpperCase()}.`);
      this.loadUsers(); // reload list
    } catch (e) {
      this.alertService.error('Gagal!', 'Gagal mengubah peran pengguna.');
    }
  }
}
