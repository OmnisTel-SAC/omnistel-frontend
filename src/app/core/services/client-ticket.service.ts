import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { TicketResponse } from '../models/ticket';
import type { PagedResponse } from '../models/paged-response';
import type { CommentResponse } from '../models/comment';
import type { AttachmentResponse } from '../models/attachment';
import { API_TICKETS } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class ClientTicketService {
  private readonly http = inject(HttpClient);

  getMyTickets(page = 0, size = 10, sort = 'createdAt,desc'): Observable<PagedResponse<TicketResponse>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PagedResponse<TicketResponse>>(`${API_TICKETS}/my-tickets`, { params });
  }

  getTicketById(id: number): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${API_TICKETS}/${id}`);
  }

  createTicket(data: { title: string; description: string; priority: string; category: string }): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${API_TICKETS}`, data);
  }

  addAttachment(ticketId: number, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${API_TICKETS}/${ticketId}/attachments`, fd);
  }

  getComments(ticketId: number): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${API_TICKETS}/${ticketId}/comments`);
  }

  addComment(ticketId: number, message: string): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${API_TICKETS}/${ticketId}/comments`, { message });
  }

  getAttachments(ticketId: number): Observable<AttachmentResponse[]> {
    return this.http.get<AttachmentResponse[]>(`${API_TICKETS}/${ticketId}/attachments`);
  }
}
