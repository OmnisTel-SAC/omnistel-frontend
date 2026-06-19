import { DatePipe, SlicePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import type { TicketResponse } from '../../../core/models/ticket';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

const CATEGORY_LABELS: Record<string, string> = {
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

@Component({
  selector: 'app-ticket-card',
  imports: [CardModule, RouterLink, PriorityBadgeComponent, StatusBadgeComponent, SlicePipe, DatePipe],
  template: `
    <p-card>
      <ng-template pTemplate="header">
        <div class="card-header">
          <app-status-badge [status]="ticket().status" />
          <app-priority-badge [priority]="ticket().priority" />
        </div>
      </ng-template>
      <ng-template pTemplate="title">
        <a [routerLink]="link()">{{ ticket().title }}</a>
      </ng-template>
      <ng-template pTemplate="content">
        <p class="description">{{ ticket().description | slice: 0: 100 }}{{ ticket().description.length > 100 ? '...' : '' }}</p>
        <div class="card-meta">
          <span class="category-badge">{{ categoryLabel() }}</span>
          <small>Creado: {{ ticket().createdAt | date: 'short' }}</small>
        </div>
      </ng-template>
    </p-card>
  `,
  styles: [`
    .card-header { display: flex; gap: 0.5rem; padding: 1rem 1rem 0; }
    a { color: var(--color-dark); text-decoration: none; font-weight: 500; }
    a:hover { color: var(--color-primary); }
    .description { color: #666; margin-bottom: 0.5rem; }
    .card-meta { display: flex; align-items: center; gap: 0.75rem; }
    .category-badge { background: #f0f1ee; color: #262824; font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 999px; }
  `]
})
export class TicketCardComponent {
  readonly ticket = input.required<TicketResponse>();
  readonly link = input<string>('');

  readonly categoryLabel = () => CATEGORY_LABELS[this.ticket().category] || this.ticket().category;
}
