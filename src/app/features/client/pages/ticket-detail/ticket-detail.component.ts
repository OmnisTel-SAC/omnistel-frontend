import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientTicketService } from '../../../../core/services/client-ticket.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { NotificationStreamService } from '../../../../core/services/notification-stream.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { AuthService } from '../../../../core/services/auth.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { TicketResponse } from '../../../../core/models/ticket';
import type { CommentResponse } from '../../../../core/models/comment';
import type { AttachmentResponse } from '../../../../core/models/attachment';
import type { UserResponse } from '../../../../core/models/auth';
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
  selector: 'app-client-ticket-detail',
  imports: [
    DatePipe, RouterLink, ReactiveFormsModule, ButtonModule, TagModule,
    TimelineModule, TextareaModule, SkeletonModule, TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly clientTicketService = inject(ClientTicketService);
  private readonly notificationService = inject(NotificationService);
  private readonly streamService = inject(NotificationStreamService);
  readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly logger = inject(LoggerService);
  private readonly http = inject(HttpClient);

  readonly ticket = signal<TicketResponse | null>(null);
  readonly comments = signal<CommentResponse[]>([]);
  readonly attachments = signal<AttachmentResponse[]>([]);
  readonly agent = signal<UserResponse | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly imageBlobUrls = signal<Map<number, string>>(new Map());

  readonly ticketId = signal<number>(0);
  readonly currentlyViewingTicketId = signal<number | null>(null);

  private subscriptions: Subscription[] = [];

  commentForm = this.fb.group({
    message: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  readonly isResolved = computed(() => this.ticket()?.status === 'RESOLVED');
  readonly agentHasCommented = computed(() =>
    this.comments().some(c => c.userRole === 'AGENT')
  );
  readonly canComment = computed(() => {
    const s = this.ticket()?.status;
    return s === 'IN_PROGRESS' && this.agentHasCommented();
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
      const agentName = this.agent() 
        ? `${this.agent()!.firstName} ${this.agent()!.lastName}`
        : `Agente #${t.agentId}`;
      events.push({
        type: 'status_change',
        date: new Date(t.updatedAt ?? t.createdAt),
        icon: 'pi pi-user-plus',
        title: `Agente asignado: ${agentName}`,
        color: '#3498db',
      });
    }

    for (const c of this.comments()) {
      const isClient = c.userRole === 'CLIENT';
      events.push({
        type: 'comment',
        date: new Date(c.createdAt),
        icon: isClient ? 'pi pi-user' : 'pi pi-user',
        title: isClient ? 'Tú' : 'Agente',
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
      this.router.navigate(['/client/my-tickets']);
      return;
    }

    this.ticketId.set(id);
    this.currentlyViewingTicketId.set(id);

    this.notificationService.markAllReadByTicket(id).subscribe();

    this.loadData();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.currentlyViewingTicketId.set(null);
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    for (const url of this.imageBlobUrls().values()) {
      URL.revokeObjectURL(url);
    }
  }

  private loadData(): void {
    this.loading.set(true);
    const id = this.ticketId();

    this.clientTicketService.getTicketById(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        if (ticket.agentId) {
          this.loadAgent(ticket.agentId);
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
          reject: () => this.router.navigate(['/client/my-tickets']),
        });
      },
    });

    this.clientTicketService.getComments(id).subscribe({
      next: (comments) => this.comments.set(comments),
    });

    this.loadAttachments();
  }

  private loadAttachments(): void {
    this.clientTicketService.getAttachments(this.ticketId()).subscribe({
      next: (atts) => {
        this.attachments.set(atts.map(a => ({ ...a, isBroken: false })));
        for (const att of atts) {
          if (this.isImageFile(att.fileName)) {
            this.loadAttachmentBlob(att);
          }
        }
      },
      error: () => this.logger.error('ClientTicketDetail', 'Failed to load attachments', this.ticketId()),
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

  private loadAgent(agentId: number): void {
    this.authService.getUserById(agentId).subscribe({
      next: (user) => this.agent.set(user),
      error: () => this.logger.error('ClientTicketDetail', 'Failed to load agent', agentId),
    });
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

  private refreshComments(): void {
    this.clientTicketService.getComments(this.ticketId()).subscribe({
      next: (comments) => this.comments.set(comments),
    });
  }

  private refreshTicket(): void {
    this.clientTicketService.getTicketById(this.ticketId()).subscribe({
      next: (ticket) => this.ticket.set(ticket),
    });
  }

  onSubmitComment(): void {
    if (this.commentForm.invalid) return;

    this.submitting.set(true);
    const message = this.commentForm.value.message!;

    this.clientTicketService.addComment(this.ticketId(), message).subscribe({
      next: () => {
        this.commentForm.reset();
        this.submitting.set(false);
        this.refreshComments();
      },
      error: (err: any) => {
        this.submitting.set(false);
        const msg = err.error?.message || err.message || '';
        if (/agente a/.test(msg.toLowerCase())) {
          this.confirmationService.confirm({
            header: 'Comentario no disponible',
            message: 'El agente aún no ha respondido. Espera su mensaje para poder comentar.',
            acceptVisible: false,
            rejectLabel: 'Entendido',
          });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Mensaje no enviado', detail: 'No pudimos enviar tu mensaje. Inténtalo de nuevo.' });
        }
      },
    });
  }

  markImageBroken(att: AttachmentResponse): void {
    att.isBroken = true;
  }

  isBroken(att: AttachmentResponse): boolean {
    return att.isBroken === true;
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
    };
    return map[category] ?? category;
  }

  getUserInitials(userRole: string): string {
    return userRole === 'CLIENT' ? 'T' : 'A';
  }

  getAvatarColor(userRole: string): string {
    return userRole === 'CLIENT' ? '#B8CCA8' : '#5f8ab7';
  }

  isImageFile(fileName: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  }
}
