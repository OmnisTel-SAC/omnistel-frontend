import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials);
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/users/${id}`);
  }

  getUsersByRole(role: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/users`, { params: { role } });
  }

  adminRegister(data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/admin/register`, data);
  }
}
