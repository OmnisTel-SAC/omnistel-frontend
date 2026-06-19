import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../models/auth';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = signal<UserResponse | null>(this.loadFromStorage<UserResponse>('user'));
  readonly token = signal<string | null>(this.loadFromStorage<string>('token'));

  readonly role = computed(() => this.user()?.role ?? null);
  readonly isLoggedIn = computed(() => this.token() !== null);
  readonly userId = computed(() => this.user()?.id ?? null);

  login(credentials: LoginRequest) {
    return this.authService.login(credentials).pipe(
      tap((res) => this.setSession(res))
    );
  }

  register(data: RegisterRequest) {
    return this.authService.register(data).pipe(
      tap((res) => this.setSession(res))
    );
  }

  getMe() {
    return this.authService.getMe().pipe(
      tap((user) => {
        this.user.set(user);
        this.saveToStorage('user', user);
      })
    );
  }

  logout(): void {
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  private setSession(res: AuthResponse): void {
    this.token.set(res.token);
    this.saveToStorage('token', res.token);
    this.getMe().subscribe((user) => {
      const route = user.role.toLowerCase();
      this.router.navigate([`/${route}`]);
    });
  }

  private saveToStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  }

  private loadFromStorage<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}
