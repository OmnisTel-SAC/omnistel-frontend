import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Notification } from '../models/notification';
import type { PagedResponse } from '../models/paged-response';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  getMyNotifications(page = 0, size = 20): Observable<PagedResponse<Notification>> {
    return this.http.get<PagedResponse<Notification>>(this.apiUrl, { params: { page, size } });
  }

  getUnreadCount(excludingTicketId?: number): Observable<{ count: number }> {
    let params = new HttpParams();
    if (excludingTicketId != null) {
      params = params.set('excludingTicketId', excludingTicketId);
    }
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`, { params });
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllReadByTicket(ticketId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-by-ticket/${ticketId}`, {});
  }

  markAllAsRead(): Observable<{ marked: number }> {
    return this.http.put<{ marked: number }>(`${this.apiUrl}/read-all`, {});
  }

  clearAll(): Observable<void> {
    return this.http.delete<void>(this.apiUrl);
  }
}
