import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import type { TablePageEvent } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { PriorityPipe } from '../../../../core/pipes/priority.pipe';
import { ClientTicketService } from '../../../../core/services/client-ticket.service';
import type { TicketResponse } from '../../../../core/models/ticket';
import type { PagedResponse } from '../../../../core/models/paged-response';

interface ColumnFilter {
  label: string;
  value: string;
}

@Component({
  selector: 'app-my-tickets',
  imports: [
    DatePipe, RouterLink, TableModule, TagModule, SelectModule,
    InputTextModule, ButtonModule, SkeletonModule, TooltipModule, PriorityPipe,
  ],
  templateUrl: './my-tickets.component.html',
  styleUrl: './my-tickets.component.scss',
})
export class MyTicketsComponent implements OnInit {
  private readonly clientTicketService = inject(ClientTicketService);
  private readonly router = inject(Router);

  readonly tickets = signal<TicketResponse[]>([]);
  readonly loading = signal(true);
  readonly totalRecords = signal(0);
  readonly page = signal(0);
  readonly size = signal(10);

  readonly statusOptions: ColumnFilter[] = [
    { label: 'Todos', value: '' },
    { label: 'Abierto', value: 'OPEN' },
    { label: 'Asignado', value: 'ASSIGNED' },
    { label: 'En Progreso', value: 'IN_PROGRESS' },
    { label: 'Resuelto', value: 'RESOLVED' },
  ];

  readonly categoryOptions: ColumnFilter[] = [
    { label: 'Todos', value: '' },
    { label: 'Sin conexión', value: 'SIN_CONEXION' },
    { label: 'Velocidad lenta', value: 'VELOCIDAD_LENTA' },
    { label: 'Problemas con el router', value: 'PROBLEMAS_CON_EL_ROUTER' },
    { label: 'Instalación técnica', value: 'INSTALACION_TECNICA' },
    { label: 'Cambio de plan', value: 'CAMBIO_DE_PLAN' },
    { label: 'Facturación y pagos', value: 'FACTURACION_Y_PAGOS' },
    { label: 'Problemas de telefonía', value: 'PROBLEMAS_DE_TELEFONIA' },
    { label: 'Mantenimientos', value: 'MANTENIMIENTOS' },
  ];

  readonly priorityOptions: ColumnFilter[] = [
    { label: 'Todos', value: '' },
    { label: 'Baja', value: 'LOW' },
    { label: 'Media', value: 'MEDIUM' },
    { label: 'Alta', value: 'HIGH' },
    { label: 'Crítica', value: 'CRITICAL' },
  ];

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    this.clientTicketService.getMyTickets(this.page(), this.size()).subscribe({
      next: (res: PagedResponse<TicketResponse>) => {
        this.tickets.set(res.data);
        this.totalRecords.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: TablePageEvent): void {
    const page = Math.floor(event.first / event.rows);
    this.page.set(page);
    this.size.set(event.rows);
    this.loadTickets();
  }

  onRowClick(ticket: TicketResponse): void {
    this.router.navigate(['/client/tickets', ticket.id]);
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

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'Abierto',
      ASSIGNED: 'Asignado',
      IN_PROGRESS: 'En Progreso',
      RESOLVED: 'Resuelto',
    };
    return map[status] ?? status;
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
