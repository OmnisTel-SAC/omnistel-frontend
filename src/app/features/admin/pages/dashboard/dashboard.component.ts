import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import type { ChartOptions } from 'chart.js';
import { AdminTicketService } from '../../../../core/services/admin-ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import type { TicketResponse } from '../../../../core/models/ticket';
import type { UserResponse } from '../../../../core/models/auth';

const CHART_COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#6B7280'];
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#7C3AED',
};

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    DatePipe, RouterLink, ChartModule, TableModule,
    TagModule, SkeletonModule, TooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly adminTicketService = inject(AdminTicketService);
  private readonly authService = inject(AuthService);
  readonly authStore = inject(AuthStore);

  readonly tickets = signal<TicketResponse[]>([]);
  readonly agentsCount = signal(0);
  readonly clientsCount = signal(0);
  readonly users = signal<UserResponse[]>([]);
  readonly userNameMap = computed(() => {
    const map = new Map<number, string>();
    for (const u of this.users()) {
      map.set(u.id, u.username);
    }
    return map;
  });
  readonly loading = signal(true);

  readonly totalTickets = computed(() => this.tickets().length);
  readonly queueTickets = computed(() => this.tickets().filter(t => t.status === 'OPEN').length);
  readonly inProgressTickets = computed(() => this.tickets().filter(t => t.status === 'IN_PROGRESS').length);
  readonly resolvedToday = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.tickets().filter(t => {
      if (t.status !== 'RESOLVED' || !t.resolvedAt) return false;
      return new Date(t.resolvedAt) >= today;
    }).length;
  });

  readonly recentQueueTickets = computed(() =>
    this.tickets()
      .filter(t => t.status === 'OPEN')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  readonly recentResolvedTickets = computed(() =>
    this.tickets()
      .filter(t => t.status === 'RESOLVED')
      .sort((a, b) => new Date(b.resolvedAt || b.updatedAt || b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  readonly statusChartData = computed<any>(() => {
    const labels = ['En cola', 'Asignado', 'En Progreso', 'Resuelto', 'Cerrado'];
    const statuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const counts = statuses.map(s => this.tickets().filter(t => t.status === s).length);
    return {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: CHART_COLORS,
        borderWidth: 0,
        hoverOffset: 8,
      }],
    };
  });

  readonly priorityChartData = computed<any>(() => {
    const labels = ['Baja', 'Media', 'Alta', 'Crítica'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const data = priorities.map(p => this.tickets().filter(t => t.priority === p).length);
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: priorities.map(p => PRIORITY_COLORS[p]),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    };
  });

  readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 12 },
          color: '#6b7280',
        },
      },
    },
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.adminTicketService.getAllTickets(0, 1000).subscribe({
      next: (res) => {
        this.tickets.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.authService.getUsersByRole('AGENT').subscribe({
      next: (users) => {
        this.agentsCount.set(users.length);
        this.users.update(prev => [...prev, ...users]);
      },
    });

    this.authService.getUsersByRole('CLIENT').subscribe({
      next: (users) => {
        this.clientsCount.set(users.length);
        this.users.update(prev => [...prev, ...users]);
      },
    });
  }

  getUserName(userId: number | null): string {
    if (!userId) return '—';
    return this.userNameMap().get(userId) || `#${userId}`;
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

  getStatusSeverity(status: string): 'warn' | 'info' | 'success' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'warn' | 'info' | 'success' | 'danger' | 'contrast'> = {
      OPEN: 'warn',
      ASSIGNED: 'info',
      IN_PROGRESS: 'info',
      RESOLVED: 'success',
      CLOSED: 'contrast',
    };
    return map[status];
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'Abierto',
      ASSIGNED: 'Asignado',
      IN_PROGRESS: 'En Progreso',
      RESOLVED: 'Resuelto',
      CLOSED: 'Cerrado',
    };
    return map[status] ?? status;
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
}
