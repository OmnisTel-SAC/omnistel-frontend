import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminTicketService } from '../../../../core/services/admin-ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { TicketResponse } from '../../../../core/models/ticket';
import type { CommentResponse } from '../../../../core/models/comment';
import type { UserResponse } from '../../../../core/models/auth';

interface TimelineEvent {
  type: 'created' | 'status_change' | 'comment';
  date: Date;
  icon: string;
  title: string;
  description?: string;
  userRole?: string;
  color?: string;
}

@Component({
  selector: 'app-admin-ticket-detail',
  imports: [
    DatePipe, RouterLink, FormsModule, ButtonModule, TagModule,
    TimelineModule, SkeletonModule, SelectModule,
    DialogModule, ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminTicketService = inject(AdminTicketService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly logger = inject(LoggerService);

  readonly ticket = signal<TicketResponse | null>(null);
  readonly comments = signal<CommentResponse[]>([]);
  readonly client = signal<UserResponse | null>(null);
  readonly agent = signal<UserResponse | null>(null);
  readonly agents = signal<UserResponse[]>([]);
  readonly agentOptions = computed(() =>
    this.agents().map(a => ({ ...a, fullName: `${a.firstName} ${a.lastName}` }))
  );
  readonly loading = signal(true);
  readonly assigning = signal(false);
  readonly showAssignDialog = signal(false);
  readonly selectedAgent = signal<UserResponse | null>(null);

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
      color: '#F59E0B',
    });

    for (const c of this.comments()) {
      const isAgent = c.userRole === 'AGENT';
      events.push({
        type: 'comment',
        date: new Date(c.createdAt),
        icon: 'pi pi-comment',
        title: isAgent ? 'Agente comentó' : 'Cliente comentó',
        description: c.message,
        userRole: c.userRole,
        color: isAgent ? '#3B82F6' : '#10B981',
      });
    }

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/admin/tickets']);
      return;
    }
    this.loadData(id);
    this.loadAgents();
  }

  private loadData(id: number): void {
    this.loading.set(true);

    this.adminTicketService.getTicketById(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        if (ticket.clientId) this.loadClient(ticket.clientId);
        if (ticket.agentId) this.loadAgent(ticket.agentId);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.confirmationService.confirm({
          header: 'Error',
          message: 'No pudimos cargar la información del ticket.',
          acceptVisible: false,
          rejectLabel: 'Volver',
          reject: () => this.router.navigate(['/admin/tickets']),
        });
      },
    });

    this.adminTicketService.getComments(id).subscribe({
      next: (comments) => this.comments.set(comments),
      error: () => this.logger.error('AdminTicketDetail', 'Failed to load comments for ticket', id),
    });
  }

  private loadClient(clientId: number): void {
    this.authService.getUserById(clientId).subscribe({
      next: (user) => this.client.set(user),
      error: () => this.logger.error('AdminTicketDetail', 'Failed to load client', clientId),
    });
  }

  private loadAgent(agentId: number): void {
    this.authService.getUserById(agentId).subscribe({
      next: (user) => this.agent.set(user),
      error: () => this.logger.error('AdminTicketDetail', 'Failed to load agent', agentId),
    });
  }

  private loadAgents(): void {
    this.authService.getUsersByRole('AGENT').subscribe({
      next: (users) => this.agents.set(users),
      error: () => this.logger.error('AdminTicketDetail', 'Failed to load agents'),
    });
  }

  openAssignDialog(): void {
    this.selectedAgent.set(null);
    this.showAssignDialog.set(true);
  }

  confirmAssign(): void {
    const ticket = this.ticket();
    const agent = this.selectedAgent();
    if (!ticket || !agent) return;

    this.assigning.set(true);
    this.adminTicketService.updateTicketStatus(ticket.id, 'ASSIGNED', agent.id).subscribe({
      next: () => {
        this.assigning.set(false);
        this.showAssignDialog.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Ticket asignado',
          detail: `Ticket #${ticket.id} asignado a ${agent.firstName} ${agent.lastName}.`,
          life: 4000,
        });
        this.loadData(ticket.id);
      },
      error: (err: any) => {
        this.assigning.set(false);
        const msg = err.error?.message || err.message || '';
        this.confirmationService.confirm({
          header: 'No se pudo asignar',
          message: msg || 'Ocurrió un error al asignar el ticket.',
          acceptVisible: false,
          rejectLabel: 'Entendido',
        });
      },
    });
  }

  updateStatus(newStatus: string): void {
    const ticket = this.ticket();
    if (!ticket) return;

    this.adminTicketService.updateTicketStatus(ticket.id, newStatus).subscribe({
      next: () => {
        const label = this.getStatusLabel(newStatus);
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `Ticket #${ticket.id} ahora está "${label}".`,
          life: 4000,
        });
        this.loadData(ticket.id);
      },
      error: (err: any) => {
        const msg = err.error?.message || err.message || '';
        this.confirmationService.confirm({
          header: 'No se pudo actualizar',
          message: msg || 'Ocurrió un error al actualizar el estado.',
          acceptVisible: false,
          rejectLabel: 'Entendido',
        });
      },
    });
  }

  getStatusSeverity(status: string): 'warn' | 'info' | 'success' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'warn' | 'info' | 'success' | 'danger' | 'contrast'> = {
      OPEN: 'warn', ASSIGNED: 'info', IN_PROGRESS: 'info', RESOLVED: 'success', CLOSED: 'contrast',
    };
    return map[status];
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'Abierto', ASSIGNED: 'Asignado', IN_PROGRESS: 'En Progreso', RESOLVED: 'Resuelto', CLOSED: 'Cerrado',
    };
    return map[status] ?? status;
  }

  getPrioritySeverity(priority: string): 'success' | 'warn' | 'danger' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger'> = {
      LOW: 'success', MEDIUM: 'warn', HIGH: 'danger', CRITICAL: 'danger',
    };
    return map[priority];
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica',
    };
    return map[priority] ?? priority;
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      SIN_CONEXION: 'Sin conexión', VELOCIDAD_LENTA: 'Velocidad lenta',
      PROBLEMAS_CON_EL_ROUTER: 'Problemas con el router', INSTALACION_TECNICA: 'Instalación técnica',
      CAMBIO_DE_PLAN: 'Cambio de plan', FACTURACION_Y_PAGOS: 'Facturación y pagos',
      PROBLEMAS_DE_TELEFONIA: 'Problemas de telefonía', MANTENIMIENTOS: 'Mantenimientos',
    };
    return map[category] ?? category;
  }

  getUserInitials(user: UserResponse | null, fallback: string): string {
    if (!user) return fallback;
    return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
  }
}
