import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { AlertService } from '../../../core/services/alert.service';
import { createClientPagination } from '../../../shared/util/pagination.util';

@Component({
  selector: 'app-users-crud',
  standalone: true,
  imports: [TableComponent, BadgeComponent, ButtonComponent, DatePipe, UpperCasePipe, PaginationComponent],
  template: `
    <div class="animate-fade-in flex flex-col gap-6">
      
      <!-- Top Header Action bar -->
      <div class="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
        <h2 class="font-display font-bold text-slate-800 text-sm">Users Manager</h2>
        <span class="text-xs text-slate-400 font-semibold">Total Accounts: {{ usersList().length }}</span>
      </div>

      <!-- Data Table -->
      @if (loading()) {
        <div class="p-8 text-center text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100 shadow-xs">Loading users...</div>
      } @else {
        <app-table>
          <tr table-headers>
            <th class="px-5 py-3">User</th>
            <th class="px-5 py-3">Phone</th>
            <th class="px-5 py-3">Role</th>
            <th class="px-5 py-3">Joined Date</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>

          <ng-container table-rows>
            @for (user of pagination.paged(); track user.id) {
              <tr class="hover:bg-slate-50/30 text-xs">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-full bg-primary-50 text-primary-700 font-extrabold flex items-center justify-center border border-primary-100">
                      {{ user.name.substring(0, 2).toUpperCase() }}
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-slate-800">{{ user.name }}</span>
                      <span class="text-[10px] text-slate-400">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 text-slate-500">{{ user.phone || '-' }}</td>
                <td class="px-5 py-4 font-semibold">
                  <app-badge [variant]="user.role === 'admin' ? 'danger' : 'secondary'">
                    {{ user.role | uppercase }}
                  </app-badge>
                </td>
                <td class="px-5 py-4 text-slate-500">{{ user.joinedAt | date: 'mediumDate' }}</td>
                <td class="px-5 py-4 text-right">
                  <app-button
                    (click)="toggleRole(user)"
                    variant="outline"
                    size="sm"
                    class="py-1 px-2.5 text-[10px] font-semibold"
                  >
                    Change to {{ user.role === 'admin' ? 'Customer' : 'Admin' }}
                  </app-button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="p-8 text-center text-slate-400">No users found.</td>
              </tr>
            }
          </ng-container>
        </app-table>

        <app-pagination
          [currentPage]="pagination.page()"
          [totalPages]="pagination.totalPages()"
          (pageChange)="pagination.setPage($event)"
        ></app-pagination>
      }

    </div>
  `
})
export class UsersCrudComponent implements OnInit {
  private readonly apiService = inject(ApiService);
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
      const users = await this.apiService.getUsers();
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
      await this.apiService.saveUser(updatedUser);
      this.alertService.success('Berhasil!', `Peran pengguna "${user.name}" berhasil diubah menjadi ${newRole.toUpperCase()}.`);
      this.loadUsers(); // reload list
    } catch (e) {
      this.alertService.error('Gagal!', 'Gagal mengubah peran pengguna.');
    }
  }
}
