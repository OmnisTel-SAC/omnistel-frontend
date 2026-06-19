import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminTicketService } from '../../../../core/services/admin-ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import type { TicketResponse } from '../../../../core/models/ticket';
import type { UserResponse } from '../../../../core/models/auth';

interface FilterOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-admin-tickets',
  imports: [
    DatePipe, RouterLink, FormsModule, ButtonModule, TableModule, TagModule,
    SelectModule, DialogModule, ConfirmDialogModule, SkeletonModule, TooltipModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss',
})
export class TicketsComponent implements OnInit {
  private readonly adminTicketService = inject(AdminTicketService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly tickets = signal<TicketResponse[]>([]);
  readonly agents = signal<UserResponse[]>([]);
  readonly clients = signal<UserResponse[]>([]);
  readonly agentOptions = computed(() =>
    this.agents().map(a => ({ ...a, fullName: `${a.firstName} ${a.lastName}` }))
  );
  readonly userNameMap = computed(() => {
    const map = new Map<number, string>();
    for (const u of [...this.agents(), ...this.clients()]) {
      map.set(u.id, u.username);
    }
    return map;
  });
  readonly loading = signal(true);
  readonly assigning = signal(false);
  readonly updatingStatus = signal(false);

  readonly statusFilter = signal<string | null>(null);
  readonly priorityFilter = signal<string | null>(null);

  readonly showAssignDialog = signal(false);
  readonly selectedTicket = signal<TicketResponse | null>(null);
  readonly selectedAgent = signal<UserResponse | null>(null);

  readonly statusOptions: FilterOption[] = [
    { label: 'Todos', value: null },
    { label: 'Abierto', value: 'OPEN' },
    { label: 'Asignado', value: 'ASSIGNED' },
    { label: 'En Progreso', value: 'IN_PROGRESS' },
    { label: 'Resuelto', value: 'RESOLVED' },
  ];

  readonly priorityOptions: FilterOption[] = [
    { label: 'Todas', value: null },
    { label: 'Baja', value: 'LOW' },
    { label: 'Media', value: 'MEDIUM' },
    { label: 'Alta', value: 'HIGH' },
    { label: 'Crítica', value: 'CRITICAL' },
  ];

  readonly filteredTickets = signal<TicketResponse[]>([]);

  ngOnInit(): void {
    this.loadTickets();
    this.loadAgents();
    this.loadClients();
  }

  private loadTickets(): void {
    this.loading.set(true);
    this.adminTicketService.getAllTickets(0, 200, 'createdAt,desc').subscribe({
      next: (res) => {
        this.tickets.set(res.data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadAgents(): void {
    this.authService.getUsersByRole('AGENT').subscribe({
      next: (users) => this.agents.set(users),
    });
  }

  private loadClients(): void {
    this.authService.getUsersByRole('CLIENT').subscribe({
      next: (users) => this.clients.set(users),
    });
  }

  getUserName(userId: number | null): string {
    if (!userId) return '—';
    return this.userNameMap().get(userId) || `#${userId}`;
  }

  applyFilters(): void {
    let result = this.tickets();
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    if (status) result = result.filter(t => t.status === status);
    if (priority) result = result.filter(t => t.priority === priority);
    this.filteredTickets.set(result);
  }

  openAssignDialog(ticket: TicketResponse): void {
    this.selectedTicket.set(ticket);
    this.selectedAgent.set(null);
    this.showAssignDialog.set(true);
  }

  confirmAssign(): void {
    const ticket = this.selectedTicket();
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
        this.loadTickets();
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

  updateStatus(ticket: TicketResponse, newStatus: string): void {
    this.updatingStatus.set(true);
    this.adminTicketService.updateTicketStatus(ticket.id, newStatus).subscribe({
      next: () => {
        this.updatingStatus.set(false);
        const label = this.getStatusLabel(newStatus);
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `Ticket #${ticket.id} ahora está "${label}".`,
          life: 4000,
        });
        this.loadTickets();
      },
      error: (err: any) => {
        this.updatingStatus.set(false);
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
}
