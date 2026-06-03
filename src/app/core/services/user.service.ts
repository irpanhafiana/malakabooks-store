import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly authService = inject(AuthService);

  getAll(): Observable<User[]> {
    const users = this.authService.getAllUsers();
    return of(users).pipe(delay(250));
  }

  getById(id: string): Observable<User | undefined> {
    const user = this.authService.getAllUsers().find((u) => u.id === id);
    return of(user).pipe(delay(150));
  }
}
