import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import type { ChartOptions } from 'chart.js';
import { ClientTicketService } from '../../../../core/services/client-ticket.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import type { TicketResponse } from '../../../../core/models/ticket';

interface CategoryLabel {
  value: string;
  label: string;
}

const CATEGORIES: CategoryLabel[] = [
  { value: 'SIN_CONEXION', label: 'Sin conexión' },
  { value: 'VELOCIDAD_LENTA', label: 'Velocidad lenta' },
  { value: 'PROBLEMAS_CON_EL_ROUTER', label: 'Problemas con el router' },
  { value: 'INSTALACION_TECNICA', label: 'Instalación técnica' },
  { value: 'CAMBIO_DE_PLAN', label: 'Cambio de plan' },
  { value: 'FACTURACION_Y_PAGOS', label: 'Facturación y pagos' },
  { value: 'PROBLEMAS_DE_TELEFONIA', label: 'Problemas de telefonía' },
  { value: 'MANTENIMIENTOS', label: 'Mantenimientos' },
];

const CHART_COLORS = ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE'];
const BAR_COLORS = ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7', '#1B1B1B', '#6B7280'];

@Component({
  selector: 'app-client-dashboard',
  imports: [
    DatePipe, RouterLink, ChartModule, TableModule,
    TagModule, SkeletonModule, TooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly clientTicketService = inject(ClientTicketService);
  readonly authStore = inject(AuthStore);

  readonly tickets = signal<TicketResponse[]>([]);
  readonly loading = signal(true);

  readonly totalTickets = computed(() => this.tickets().length);
  readonly openTickets = computed(() =>
    this.tickets().filter((t) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length
  );
  readonly resolvedThisMonth = computed(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.tickets().filter((t) => {
      if (t.status !== 'RESOLVED' || !t.resolvedAt) return false;
      return new Date(t.resolvedAt) >= startOfMonth;
    }).length;
  });

  readonly recentTickets = computed(() =>
    this.tickets().slice(0, 5)
  );

  readonly tableData = computed(() => this.recentTickets());
  readonly tableTitle = 'Últimos tickets creados';

  readonly statusChartData = computed<any>(() => {
    const statuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
    const labels = ['Abierto', 'Asignado', 'En Progreso', 'Resuelto'];
    const counts = statuses.map((s) => this.tickets().filter((t) => t.status === s).length);
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

  readonly categoryChartData = computed<any>(() => {
    const labels = CATEGORIES.map((c) => c.label);
    const data = CATEGORIES.map((c) => this.tickets().filter((t) => t.category === c.value).length);
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
        hoverBackgroundColor: data.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
        borderRadius: 12,
        borderSkipped: false,
        categoryPercentage: 0.8,
        barPercentage: 0.75,
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

  readonly barOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 8,
        bottom: 8,
        right: 12,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: '#f3f4f6',
          drawTicks: false,
        },
        border: { display: false },
        beginAtZero: true,
        ticks: {
          color: '#9ca3af',
          font: { size: 11, family: 'Inter, sans-serif' },
          stepSize: 1,
          padding: 6,
        },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#374151',
          font: { size: 11, family: 'Inter, sans-serif' },
          padding: 8,
        },
      },
    },
  };

  ngOnInit(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
    this.clientTicketService.getMyTickets(0, 100).subscribe({
      next: (res) => {
        this.tickets.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
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
    const found = CATEGORIES.find((c) => c.value === category);
    return found?.label ?? category;
  }
}
