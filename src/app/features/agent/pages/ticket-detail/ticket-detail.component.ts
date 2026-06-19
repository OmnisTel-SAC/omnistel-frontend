import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AgentTicketService } from '../../../../core/services/agent-ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { TicketResponse } from '../../../../core/models/ticket';
import type { CommentResponse } from '../../../../core/models/comment';
import type { AttachmentResponse } from '../../../../core/models/attachment';
import type { UserResponse } from '../../../../core/models/auth';
import { NotificationService } from '../../../../core/services/notification.service';
import { NotificationStreamService } from '../../../../core/services/notification-stream.service';
import { Subscription } from 'rxjs';

interface TimelineEvent {
  type: 'created' | 'status_change' | 'comment';
  date: Date;
  icon: string;
  title: string;
  description?: string;
  userRole?: string;
  userId?: number;
  color?: string;
}

@Component({
  selector: 'app-agent-ticket-detail',
  imports: [
    DatePipe, RouterLink, ReactiveFormsModule, ButtonModule, TagModule,
    TimelineModule, TextareaModule, SkeletonModule, TooltipModule,
    DialogModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly agentTicketService = inject(AgentTicketService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly notificationService = inject(NotificationService);
  private readonly streamService = inject(NotificationStreamService);
  private readonly logger = inject(LoggerService);
  private readonly http = inject(HttpClient);
  private subscriptions: Subscription[] = [];

  readonly ticket = signal<TicketResponse | null>(null);
  readonly comments = signal<CommentResponse[]>([]);
  readonly attachments = signal<AttachmentResponse[]>([]);
  readonly client = signal<UserResponse | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly updating = signal(false);
  readonly imageBlobUrls = signal<Map<number, string>>(new Map());

  readonly ticketId = signal<number>(0);

  readonly showPreview = signal(false);
  readonly previewUrl = signal('');
  readonly previewFileName = signal('');
  readonly zoom = signal(1);
  readonly rotation = signal(0);

  commentForm = this.fb.group({
    message: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  readonly isResolved = computed(() => this.ticket()?.status === 'RESOLVED');
  readonly canAct = computed(() => {
    const s = this.ticket()?.status;
    return s === 'ASSIGNED' || s === 'IN_PROGRESS';
  });

  readonly canComment = computed(() => {
    const s = this.ticket()?.status;
    return s === 'IN_PROGRESS';
  });

  readonly timelineEvents = computed<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];
    const t = this.ticket();
    if (!t) return events;

    events.push({
      type: 'created',
      date: new Date(t.createdAt),
      icon: 'pi pi-plus-circle',
      title: 'Ticket creado',
      description: t.description,
      color: '#C4D2B9',
    });

    if (t.agentId) {
      events.push({
        type: 'status_change',
        date: new Date(t.updatedAt ?? t.createdAt),
        icon: 'pi pi-user-plus',
        title: `Agente asignado #${t.agentId}`,
        color: '#3498db',
      });
    }

    for (const c of this.comments()) {
      const isClient = c.userRole === 'CLIENT';
      events.push({
        type: 'comment',
        date: new Date(c.createdAt),
        icon: 'pi pi-user',
        title: isClient ? 'Cliente' : 'Tú',
        description: c.message,
        userRole: c.userRole,
        userId: c.userId,
        color: isClient ? '#B8CCA8' : '#5f8ab7',
      });
    }

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/agent/tickets']);
      return;
    }

    this.ticketId.set(id);
    this.loadData();
    this.notificationService.markAllReadByTicket(id).subscribe();
    this.connectSse();
  }

  private loadData(): void {
    this.loading.set(true);
    const id = this.ticketId();

    this.agentTicketService.getTicketById(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        if (ticket.clientId) {
          this.loadClient(ticket.clientId);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.confirmationService.confirm({
          header: 'Error',
          message: 'No pudimos cargar la información del ticket. Te redirigiremos a tus tickets.',
          acceptVisible: false,
          rejectLabel: 'Entendido',
          reject: () => this.router.navigate(['/agent/tickets']),
        });
      },
    });

    this.agentTicketService.getComments(id).subscribe({
      next: (comments) => this.comments.set(comments),
      error: () => this.logger.error('AgentTicketDetail', 'Failed to load comments', id),
    });

    this.loadAttachments();
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    for (const url of this.imageBlobUrls().values()) {
      URL.revokeObjectURL(url);
    }
  }

  private connectSse(): void {
    this.streamService.connect();

    const sub = this.streamService.events$.subscribe((event) => {
      if (event.ticketId !== this.ticketId()) return;
      if (event.type === 'new_comment') {
        this.refreshComments();
      } else if (event.type === 'status_change') {
        this.refreshTicket();
      }
    });

    this.subscriptions.push(sub);
  }

  private loadAttachments(): void {
    this.agentTicketService.getAttachments(this.ticketId()).subscribe({
      next: (atts) => {
        this.attachments.set(atts.map(a => ({ ...a, isBroken: false })));
        for (const att of atts) {
          if (this.isImageFile(att.fileName)) {
            this.loadAttachmentBlob(att);
          }
        }
      },
      error: () => this.logger.error('AgentTicketDetail', 'Failed to load attachments', this.ticketId()),
    });
  }

  private loadAttachmentBlob(att: AttachmentResponse): void {
    this.http.get(att.fileUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.imageBlobUrls.update(map => {
          const m = new Map(map);
          m.set(att.id, url);
          return m;
        });
      },
      error: () => {
        (att as any).isBroken = true;
      },
    });
  }

  private loadClient(clientId: number): void {
    this.authService.getUserById(clientId).subscribe({
      next: (user) => this.client.set(user),
      error: () => this.logger.error('AgentTicketDetail', 'Failed to load client', clientId),
    });
  }

  onSubmitComment(): void {
    if (this.commentForm.invalid) return;

    this.submitting.set(true);
    const message = this.commentForm.value.message!;

    this.agentTicketService.addComment(this.ticketId(), message).subscribe({
      next: () => {
        this.commentForm.reset();
        this.submitting.set(false);
        this.refreshComments();
        this.messageService.add({ severity: 'success', summary: 'Comentario enviado' });
      },
      error: () => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Mensaje no enviado', detail: 'No pudimos enviar tu mensaje. Inténtalo de nuevo.' });
      },
    });
  }

  updateStatus(status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'): void {
    this.updating.set(true);
    this.agentTicketService.updateTicketStatus(this.ticketId(), status).subscribe({
      next: () => {
        this.updating.set(false);
        this.refreshTicket();
        this.refreshComments();
        const label = this.getStatusLabel(status);
        this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `Ticket marcado como: ${label}` });
      },
      error: (err) => {
        this.updating.set(false);
        const msg = err.error?.message || err.message || 'Error al actualizar estado';
        if (msg.toLowerCase().includes('responder al cliente')) {
          this.messageService.clear();
          this.confirmationService.confirm({
            message: msg,
            header: 'Acción requerida',
            icon: 'pi pi-comment',
            acceptVisible: false,
            rejectLabel: 'Entendido',
            rejectButtonStyleClass: 'p-button-text',
          });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Acción no completada', detail: 'No pudimos completar la acción. Inténtalo de nuevo.' });
        }
      },
    });
  }

  markImageBroken(att: AttachmentResponse): void {
    (att as any).isBroken = true;
  }

  openPreview(att: AttachmentResponse): void {
    this.previewUrl.set(this.imageBlobUrls().get(att.id) || att.fileUrl);
    this.previewFileName.set(att.fileName);
    this.zoom.set(1);
    this.rotation.set(0);
    this.showPreview.set(true);
  }

  closePreview(): void {
    this.showPreview.set(false);
  }

  zoomIn(): void {
    this.zoom.update(z => Math.min(z + 0.25, 4));
  }

  zoomOut(): void {
    this.zoom.update(z => Math.max(z - 0.25, 0.25));
  }

  rotateImage(): void {
    this.rotation.update(r => r + 90);
  }

  resetPreview(): void {
    this.zoom.set(1);
    this.rotation.set(0);
  }

  private refreshComments(): void {
    this.agentTicketService.getComments(this.ticketId()).subscribe({
      next: (comments) => this.comments.set(comments),
    });
  }

  private refreshTicket(): void {
    this.agentTicketService.getTicketById(this.ticketId()).subscribe({
      next: (ticket) => this.ticket.set(ticket),
    });
  }

  getStatusSeverity(status: string): 'warn' | 'info' | 'success' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'warn' | 'info' | 'success' | 'danger' | 'contrast'> = {
      OPEN: 'warn',
      ASSIGNED: 'info',
      IN_PROGRESS: 'info',
      RESOLVED: 'success',
    };
    return map[status];
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'Abierto',
      ASSIGNED: 'Asignado',
      IN_PROGRESS: 'En Progreso',
      RESOLVED: 'Resuelto',
    };
    return map[status] ?? status;
  }

  getPrioritySeverity(priority: string): 'success' | 'warn' | 'danger' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger'> = {
      LOW: 'success',
      MEDIUM: 'warn',
      HIGH: 'danger',
      CRITICAL: 'danger',
    };
    return map[priority];
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      CRITICAL: 'Crítica',
    };
    return map[priority] ?? priority;
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      SIN_CONEXION: 'Sin conexión',
      VELOCIDAD_LENTA: 'Velocidad lenta',
      PROBLEMAS_CON_EL_ROUTER: 'Problemas con el router',
      INSTALACION_TECNICA: 'Instalación técnica',
      CAMBIO_DE_PLAN: 'Cambio de plan',
      FACTURACION_Y_PAGOS: 'Facturación y pagos',
      PROBLEMAS_DE_TELEFONIA: 'Problemas de telefonía',
      MANTENIMIENTOS: 'Mantenimientos',
      OTROS: 'Otros',
    };
    return map[category] ?? category;
  }

  isImageFile(fileName: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  }

  isBroken(att: AttachmentResponse): boolean {
    return (att as any).isBroken === true;
  }
}
