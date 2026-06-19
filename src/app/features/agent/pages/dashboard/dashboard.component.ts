import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthStore } from '../../../../core/stores/auth.store';
import { AgentTicketService } from '../../../../core/services/agent-ticket.service';
import type { TicketResponse } from '../../../../core/models/ticket';
import type { PagedResponse } from '../../../../core/models/paged-response';
import { PriorityPipe } from '../../../../core/pipes/priority.pipe';

@Component({
  selector: 'app-agent-dashboard',
  imports: [
    DatePipe, RouterLink,
    ChartModule, ButtonModule, TagModule, SkeletonModule,
    TooltipModule, ConfirmDialogModule, ToastModule, PriorityPipe,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly agentTicketService = inject(AgentTicketService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  // Raw data
  readonly allQueueTickets = signal<TicketResponse[]>([]);
  readonly allAssignedTickets = signal<TicketResponse[]>([]);
  readonly loadingQueue = signal(true);
  readonly loadingAssigned = signal(true);

  // Pagination metadata for totals
  readonly totalQueue = signal(0);
  readonly totalAssigned = signal(0);

  // ─── Computed metrics ───
  readonly criticalTickets = computed(() =>
    this.allQueueTickets().filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').slice(0, 5)
  );

  readonly queuedCount = computed(() => this.totalQueue());
  readonly assignedCount = computed(() => this.allAssignedTickets().filter(t => t.status === 'ASSIGNED').length + this.allAssignedTickets().filter(t => t.status === 'IN_PROGRESS').length);
  readonly inProgressCount = computed(() => this.allAssignedTickets().filter(t => t.status === 'IN_PROGRESS').length);

  readonly resolvedToday = computed(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    return this.allAssignedTickets().filter(t => {
      if (t.status !== 'RESOLVED' || !t.resolvedAt) return false;
      return t.resolvedAt.slice(0, 10) === todayStr;
    });
  });

  readonly loading = computed(() => this.loadingQueue() || this.loadingAssigned());

  // ─── Chart data ───
  readonly chartData = computed(() => {
    const open = this.totalQueue();
    const assigned = this.allAssignedTickets().filter(t => t.status === 'ASSIGNED').length;
    const inProgress = this.allAssignedTickets().filter(t => t.status === 'IN_PROGRESS').length;
    const resolved = this.allAssignedTickets().filter(t => t.status === 'RESOLVED').length;

    return {
      labels: ['Abierto', 'Asignado', 'En Progreso', 'Resuelto'],
      datasets: [{
        data: [open, assigned, inProgress, resolved],
        backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'],
        borderWidth: 0,
      }],
    };
  });

  readonly chartOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, padding: 16, font: { size: 12 } },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  ngOnInit(): void {
    this.loadQueue();
    this.loadAssigned();
  }

  private loadQueue(): void {
    this.loadingQueue.set(true);
    this.agentTicketService.getQueueTickets(0, 100).subscribe({
      next: (res: PagedResponse<TicketResponse>) => {
        this.allQueueTickets.set(res.data);
        this.totalQueue.set(res.totalElements);
        this.loadingQueue.set(false);
      },
      error: () => this.loadingQueue.set(false),
    });
  }

  private loadAssigned(): void {
    this.loadingAssigned.set(true);
    this.agentTicketService.getAssignedTickets(0, 100).subscribe({
      next: (res: PagedResponse<TicketResponse>) => {
        this.allAssignedTickets.set(res.data);
        this.totalAssigned.set(res.totalElements);
        this.loadingAssigned.set(false);
      },
      error: () => this.loadingAssigned.set(false),
    });
  }

  confirmTakeTicket(ticket: TicketResponse): void {
    this.confirmationService.confirm({
      message: `¿Tomar el ticket #${ticket.id} — "${ticket.title}"?`,
      header: 'Confirmar',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, Tomar',
      rejectLabel: 'Cancelar',
      accept: () => this.takeTicket(ticket.id),
    });
  }

  takeTicket(id: number): void {
    this.agentTicketService.updateTicketStatus(id, 'ASSIGNED').subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Ticket asignado', detail: 'El ticket se ha asignado correctamente' });
        this.loadQueue();
        this.loadAssigned();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al tomar el ticket';
        if (msg.toLowerCase().includes('reached maximum')) {
          this.messageService.clear();
          this.confirmationService.confirm({
            message: 'Resuelve al menos 1 de tus tickets asignados para poder tomar otro.',
            header: 'Límite alcanzado',
            icon: 'pi pi-exclamation-triangle',
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

  getPrioritySeverity(priority: string): 'success' | 'warn' | 'danger' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger'> = {
      LOW: 'success',
      MEDIUM: 'warn',
      HIGH: 'danger',
      CRITICAL: 'danger',
    };
    return map[priority];
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
}
