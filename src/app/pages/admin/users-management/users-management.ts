import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-users-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './users-management.html'
})
export class UsersManagementPage implements OnInit {
  private readonly userService = inject(UserService);

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);

  isLoading = signal(true);
  searchQuery = '';

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.userService.getAll().subscribe((list) => {
      this.users.set(list);
      this.filteredUsers.set(list);
      this.isLoading.set(false);
    });
  }

  applySearch() {
    if (!this.searchQuery.trim()) {
      this.filteredUsers.set(this.users());
      return;
    }

    const q = this.searchQuery.toLowerCase();
    const result = this.users().filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    
    this.filteredUsers.set(result);
  }
}
