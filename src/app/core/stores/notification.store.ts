import { computed, Injectable, signal } from '@angular/core';
import type { Notification } from '../models/notification';
import { inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly notificationService = inject(NotificationService);

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  loadNotifications(page = 0, size = 20): void {
    this.notificationService.getMyNotifications(page, size).subscribe({
      next: (res) => this.notifications.set(res.data)
    });
  }

  loadUnreadCount(excludingTicketId?: number): void {
    this.notificationService.getUnreadCount(excludingTicketId).subscribe({
      next: (res) => this.unreadCount.set(res.count)
    });
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        this.loadUnreadCount();
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => ({ ...n, read: true }))
        );
        this.unreadCount.set(0);
      }
    });
  }

  addNotification(notification: Notification): void {
    this.notifications.update((list) => [notification, ...list]);
    this.unreadCount.update((c) => c + 1);
  }

  clearAll(): void {
    this.notificationService.clearAll().subscribe({
      next: () => {
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }
}
