import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { TicketResponse, TicketStatusUpdateRequest } from '../models/ticket';
import type { PagedResponse } from '../models/paged-response';
import type { CommentResponse } from '../models/comment';
import type { AttachmentResponse } from '../models/attachment';
import { API_TICKETS } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class AdminTicketService {
  private readonly http = inject(HttpClient);

  getAllTickets(page = 0, size = 20, sort = 'createdAt,desc'): Observable<PagedResponse<TicketResponse>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PagedResponse<TicketResponse>>(`${API_TICKETS}`, { params });
  }

  getTicketById(id: number): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${API_TICKETS}/${id}`);
  }

  updateTicketStatus(id: number, status: string, agentId?: number): Observable<TicketResponse> {
    const body: TicketStatusUpdateRequest = { status: status as any };
    if (agentId != null) {
      body.agentId = agentId;
    }
    return this.http.patch<TicketResponse>(`${API_TICKETS}/${id}/status`, body);
  }

  getComments(ticketId: number): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${API_TICKETS}/${ticketId}/comments`);
  }

  getAttachments(ticketId: number): Observable<AttachmentResponse[]> {
    return this.http.get<AttachmentResponse[]>(`${API_TICKETS}/${ticketId}/attachments`);
  }
}
