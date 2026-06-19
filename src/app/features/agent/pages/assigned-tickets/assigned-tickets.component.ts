import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import type { TablePageEvent } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AgentTicketService } from '../../../../core/services/agent-ticket.service';
import type { TicketResponse } from '../../../../core/models/ticket';
import type { PagedResponse } from '../../../../core/models/paged-response';
import { PriorityPipe } from '../../../../core/pipes/priority.pipe';

@Component({
  selector: 'app-agent-assigned-tickets',
  imports: [
    DatePipe, RouterLink,
    TableModule, TagModule, ButtonModule, SkeletonModule,
    TooltipModule, ConfirmDialogModule, ToastModule, PriorityPipe,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './assigned-tickets.component.html',
  styleUrl: './assigned-tickets.component.scss',
})
export class AssignedTicketsComponent implements OnInit {
  private readonly agentTicketService = inject(AgentTicketService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly tickets: TicketResponse[] = [];
  loading = true;
  totalRecords = 0;
  page = 0;
  size = 10;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.agentTicketService.getAssignedTickets(this.page, this.size, 'createdAt,desc', 'ASSIGNED,IN_PROGRESS').subscribe({
      next: (res: PagedResponse<TicketResponse>) => {
        this.tickets.splice(0, this.tickets.length, ...res.data);
        this.totalRecords = res.totalElements;
        this.loading = false;
      },
      error: () => this.loading = false,
    });
  }

  onPage(event: TablePageEvent): void {
    this.page = Math.floor(event.first / event.rows);
    this.size = event.rows;
    this.load();
  }

  updateStatus(id: number, status: 'IN_PROGRESS' | 'RESOLVED'): void {
    this.agentTicketService.updateTicketStatus(id, status).subscribe({
      next: () => {
        const label = this.getStatusLabel(status);
        this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `Ticket marcado como: ${label}` });
        this.load();
      },
      error: (err) => {
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

  navigateToDetail(id: number): void {
    this.router.navigate(['/agent/tickets', id]);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'Abierto',
      ASSIGNED: 'Asignado',
      IN_PROGRESS: 'En Progreso',
      RESOLVED: 'Resuelto',
      CLOSED: 'Cerrado',
      REOPENED: 'Reabierto',
    };
    return map[status] ?? status;
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

  getCategoryStyle(): Record<string, string> {
    return {
      background: '#C4D2B9',
      borderRadius: '8px',
      padding: '4px 12px',
      fontSize: '13px',
      display: 'inline-block',
    };
  }

  truncate(str: string, max: number): string {
    return str.length > max ? str.slice(0, max) + '...' : str;
  }
}
