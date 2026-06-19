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
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminTicketService } from '../../../../core/services/admin-ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import type { TicketResponse } from '../../../../core/models/ticket';
import type { UserResponse } from '../../../../core/models/auth';

@Component({
  selector: 'app-admin-queue',
  imports: [
    DatePipe, RouterLink, FormsModule, ButtonModule, TableModule, TagModule,
    SelectModule, DialogModule, ConfirmDialogModule, TooltipModule, SkeletonModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './queue.component.html',
  styleUrl: './queue.component.scss',
})
export class QueueComponent implements OnInit {
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
  readonly clientNameMap = computed(() => {
    const map = new Map<number, string>();
    for (const c of this.clients()) {
      map.set(c.id, c.username);
    }
    return map;
  });
  readonly loading = signal(true);
  readonly assigning = signal(false);

  readonly showAssignDialog = signal(false);
  readonly selectedTicket = signal<TicketResponse | null>(null);
  readonly selectedAgent = signal<UserResponse | null>(null);

  ngOnInit(): void {
    this.loadTickets();
    this.loadAgents();
    this.loadClients();
  }

  private loadTickets(): void {
    this.loading.set(true);
    this.adminTicketService.getAllTickets(0, 100, 'createdAt,desc').subscribe({
      next: (res) => {
        this.tickets.set(res.data.filter(t => t.status === 'OPEN'));
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

  getClientName(clientId: number): string {
    return this.clientNameMap().get(clientId) || `#${clientId}`;
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
          message: msg || 'Ocurrió un error al asignar el ticket. Inténtalo de nuevo.',
          acceptVisible: false,
          rejectLabel: 'Entendido',
        });
      },
    });
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
