import { Component, input } from '@angular/core';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#f39c12',
  ASSIGNED: '#3498db',
  IN_PROGRESS: '#2196F3',
  RESOLVED: '#27ae60',
  CLOSED: '#95a5a6',
  REOPENED: '#9b59b6'
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="badge" [style.background]="color()">
      {{ status() }}
    </span>
  `,
  styles: [`
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; color: #fff; font-size: 0.8rem; font-weight: 500; text-transform: uppercase; }
  `]
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly color = () => STATUS_COLORS[this.status()] || '#95a5a6';
}
