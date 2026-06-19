import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { NotificationStore } from '../../../core/stores/notification.store';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, RouterLink, TableModule, TagModule, ButtonModule, TooltipModule],
  template: `
    <div class="notif-page">
      <div class="page-header">
        <h1 class="page-header__title">Notificaciones</h1>
        <p class="page-header__subtitle">Historial completo de tus notificaciones.</p>
      </div>

      <div class="notif-card">
        <div class="notif-card__toolbar">
          <p-button
            label="Marcar todo leído"
            icon="pi pi-check-double"
            severity="secondary"
            size="small"
            (click)="store.markAllAsRead()"
            [disabled]="store.unreadCount() === 0"
          />
          <p-button
            label="Limpiar"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            (click)="store.clearAll()"
            [disabled]="store.notifications().length === 0"
          />
        </div>

        <p-table
          [value]="store.notifications()"
          [paginator]="true"
          [rows]="20"
          [rowsPerPageOptions]="[10, 20, 50]"
          [loading]="false"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Mostrando {first}-{last} de {totalRecords} notificaciones"
          styleClass="p-datatable-sm notif-card__table"
        >
          <ng-template #header>
            <tr>
              <th style="width:48px"></th>
              <th style="width:120px">Fecha</th>
              <th style="width:180px">Ticket</th>
              <th>Mensaje</th>
              <th style="width:100px">Acción</th>
            </tr>
          </ng-template>
          <ng-template #body let-n>
            <tr [class.notif-card__row--unread]="!n.read">
              <td class="notif-card__dot-col">
                @if (!n.read) {
                  <span class="notif-card__dot"></span>
                }
              </td>
              <td>{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <a [routerLink]="ticketRoute(n.ticketId)" class="notif-card__ticket-link">
                  #{{ n.ticketId }}
                </a>
              </td>
              <td>
                <div class="notif-card__title">{{ n.title }}</div>
                <div class="notif-card__message">{{ n.message }}</div>
              </td>
              <td>
                <div class="notif-card__actions">
                  @if (!n.read) {
                    <p-button
                      icon="pi pi-check"
                      severity="success"
                      size="small"
                      (click)="store.markAsRead(n.id)"
                      title="Marcar como leído"
                    />
                  }
                  <p-button
                    icon="pi pi-external-link"
                    severity="info"
                    size="small"
                    [routerLink]="ticketRoute(n.ticketId)"
                    title="Ver ticket"
                  />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="5" class="notif-card__empty">
                <i class="pi pi-bell-slash"></i>
                <span>No hay notificaciones</span>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .notif-page { max-width: 960px; margin: 0 auto; animation: fade-up 0.3s ease; padding: 1.5rem; }
    .page-header { margin-bottom: 24px; }
    .page-header__title { font-size: 28px; font-weight: 700; color: #1f2937; margin: 0; }
    .page-header__subtitle { margin-top: 4px; font-size: 14px; color: #6b7280; }
    .notif-card { background: #ffffff; border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
    .notif-card__toolbar { margin-bottom: 1rem; display: flex; gap: 0.5rem; }
    .notif-card__table { font-size: 0.875rem; }
    .notif-card__row--unread { background: rgb(155 208 74 / 0.06); }
    .notif-card__dot-col { text-align: center; }
    .notif-card__dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #FF6606; vertical-align: middle; }
    .notif-card__ticket-link { color: #2563eb; font-weight: 600; text-decoration: none; }
    .notif-card__ticket-link:hover { text-decoration: underline; }
    .notif-card__title { font-weight: 600; color: #111827; }
    .notif-card__message { color: #6b7280; font-size: 0.8125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px; }
    .notif-card__actions { display: flex; gap: 0.25rem; }
    .notif-card__empty { text-align: center; padding: 2rem; color: #9ca3af; }
    .notif-card__empty i { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    :host ::ng-deep .p-datatable { background: #ffffff; border-radius: 12px; overflow: hidden; }
    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th { background: #f9fafb; color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px; border: none; border-bottom: 1px solid #e5e7eb; }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr { background: #ffffff; transition: background 0.15s; }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover { background: #f9fafb !important; }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td { padding: 14px 16px; border: none; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 0.875rem; background: #ffffff; }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:last-child > td { border-bottom: none; }
  `]
})
export class NotificationsPageComponent implements OnInit {
  readonly store = inject(NotificationStore);
  readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    this.store.loadNotifications(0, 50);
    this.store.loadUnreadCount();
  }

  ticketRoute(ticketId: number): string {
    const role = this.authStore.role();
    switch (role) {
      case 'CLIENT': return `/client/tickets/${ticketId}`;
      case 'AGENT': return `/agent/tickets/${ticketId}`;
      case 'ADMIN': return `/admin/tickets/${ticketId}`;
      default: return '/';
    }
  }
}
