import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';
import { USERS_DATA } from '../data/users.data';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_KEY = 'malaka_users';
  private readonly SESSION_KEY = 'malaka_session';

  // In-memory list of users initialized from localStorage or dummy data
  private users = signal<User[]>([]);
  // Current logged in user
  private currentSession = signal<User | null>(null);

  constructor() {
    this.initUsers();
    this.initSession();
  }

  private initUsers() {
    const storedUsers = localStorage.getItem(this.USERS_KEY);
    if (storedUsers) {
      this.users.set(JSON.parse(storedUsers));
    } else {
      this.users.set(USERS_DATA);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(USERS_DATA));
    }
  }

  private initSession() {
    const storedSession = localStorage.getItem(this.SESSION_KEY);
    if (storedSession) {
      this.currentSession.set(JSON.parse(storedSession));
    }
  }

  // Signals
  readonly currentUser = computed(() => this.currentSession());
  readonly isLoggedIn = computed(() => this.currentSession() !== null);
  readonly isAdmin = computed(() => this.currentSession()?.role === 'admin');

  // Methods
  login(email: string, password: string): Observable<User> {
    const foundUser = this.users().find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      this.currentSession.set(foundUser);
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(foundUser));
      return of(foundUser).pipe(delay(300));
    } else {
      return throwError(() => new Error('Email atau password salah.')).pipe(delay(300));
    }
  }

  register(userData: Omit<User, 'id' | 'role' | 'avatar' | 'createdAt'>): Observable<User> {
    const emailExists = this.users().some(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );

    if (emailExists) {
      return throwError(() => new Error('Email sudah terdaftar.')).pipe(delay(300));
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      role: 'customer',
      avatar: `https://images.unsplash.com/photo-${1535700000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=200` || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...this.users(), newUser];
    this.users.set(updatedUsers);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));

    // Auto login
    this.currentSession.set(newUser);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(newUser));

    return of(newUser).pipe(delay(400));
  }

  logout(): Observable<boolean> {
    this.currentSession.set(null);
    localStorage.removeItem(this.SESSION_KEY);
    return of(true).pipe(delay(200));
  }

  updateProfile(name: string, phone: string): Observable<User> {
    const current = this.currentSession();
    if (!current) {
      return throwError(() => new Error('Sesi tidak ditemukan.')).pipe(delay(200));
    }

    const updatedUser: User = {
      ...current,
      name,
      phone
    };

    // Update in users list
    const updatedUsers = this.users().map((u) => (u.id === current.id ? updatedUser : u));
    this.users.set(updatedUsers);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));

    // Update session
    this.currentSession.set(updatedUser);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedUser));

    return of(updatedUser).pipe(delay(300));
  }

  getAllUsers(): User[] {
    return this.users();
  }
}
