import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationStore } from '../../../../core/stores/notification.store';
import { NotificationStreamService } from '../../../../core/services/notification-stream.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink, DatePipe],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly store = inject(NotificationStore);
  readonly streamService = inject(NotificationStreamService);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  panelOpen = false;
  private subscriptions: Subscription[] = [];
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.store.loadNotifications();
    this.store.loadUnreadCount();
    this.streamService.connect();

    const sub = this.streamService.events$.subscribe(() => {
      this.store.loadUnreadCount();
      this.store.loadNotifications();
    });
    this.subscriptions.push(sub);

    this.refreshInterval = setInterval(() => {
      this.store.loadUnreadCount();
    }, 30000);
  }

  ngOnDestroy(): void {
    this.streamService.disconnect();
    for (const sub of this.subscriptions) sub.unsubscribe();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    if (this.panelOpen) {
      this.store.loadNotifications();
      this.store.loadUnreadCount();
    }
  }

  markRead(id: string, event: Event): void {
    event.stopPropagation();
    this.store.markAsRead(id);
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    this.store.markAllAsRead();
  }

  navigateToTicket(ticketId: number): void {
    this.panelOpen = false;
    const role = this.authStore.role();
    switch (role) {
      case 'CLIENT': this.router.navigate(['/client/tickets', ticketId]); break;
      case 'AGENT': this.router.navigate(['/agent/tickets', ticketId]); break;
      case 'ADMIN': this.router.navigate(['/admin/tickets', ticketId]); break;
    }
  }
}
