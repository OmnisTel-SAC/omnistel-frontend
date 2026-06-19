import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

export interface SseEvent {
  type: 'status_change' | 'new_comment' | string;
  ticketId: number;
  data: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationStreamService {
  private readonly authStore = inject(AuthStore);
  private readonly zone = inject(NgZone);

  private abortController: AbortController | null = null;
  private readonly eventSubject = new Subject<SseEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Infinity;
  private shouldReconnect = true;

  readonly connected = signal(false);
  readonly events$: Observable<SseEvent> = this.eventSubject.asObservable();

  connect(): void {
    if (this.abortController) return;
    if (this.connected()) return;

    const userId = this.authStore.userId();
    const token = this.authStore.token();
    if (!userId || !token) return;

    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.startStream(userId, token);
  }

  private async startStream(userId: number, token: string): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch('/api/notifications/stream', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': String(userId),
        },
        signal: this.abortController.signal,
      });

      if (!response.ok || !response.body) {
        if (response.status === 401) {
          this.disconnect();
          this.authStore.logout();
          return;
        }
        this.handleReconnect(userId, token);
        return;
      }

      this.zone.run(() => {
        this.connected.set(true);
        this.reconnectAttempts = 0;
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        this.processLines(lines);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }

    this.zone.run(() => {
      this.connected.set(false);
      this.abortController = null;
      this.handleReconnect(userId, token);
    });
  }

  private processLines(lines: string[]): void {
    let currentType = '';
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        currentData = line.slice(5).trim();
      } else if (line === '' && currentType && currentData) {
        this.dispatchEvent(currentType, currentData);
        currentType = '';
        currentData = '';
      }
    }
  }

  private dispatchEvent(type: string, raw: string): void {
    this.zone.run(() => {
      try {
        const parsed = JSON.parse(raw);
        this.eventSubject.next({
          type,
          ticketId: parsed.ticketId ?? 0,
          data: raw,
        });
      } catch {
        // ignore parse errors
      }
    });
  }

  private handleReconnect(userId: number, token: string): void {
    if (!this.shouldReconnect) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.startStream(userId, token);
      }
    }, delay);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.abortController?.abort();
    this.abortController = null;
    this.zone.run(() => this.connected.set(false));
  }
}
