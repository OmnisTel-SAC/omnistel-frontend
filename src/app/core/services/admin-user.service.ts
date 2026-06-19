import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_AUTH } from '../models/auth';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  enabled: boolean;
}

export interface PagedUsers {
  content: UserResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);

  getUsers(page = 0, size = 10): Observable<PagedUsers> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedUsers>(`${API_AUTH}/admin/usuarios`, { params });
  }

  toggleUserStatus(userId: number): Observable<void> {
    return this.http.patch<void>(`${API_AUTH}/admin/usuarios/${userId}/toggle`, {});
  }

  changeUserRole(userId: number, role: string): Observable<void> {
    return this.http.patch<void>(`${API_AUTH}/admin/usuarios/${userId}/rol`, { role });
  }
}
