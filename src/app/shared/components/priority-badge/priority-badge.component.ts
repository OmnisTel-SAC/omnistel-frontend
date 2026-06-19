import { Component, input } from '@angular/core';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#27ae60',
  MEDIUM: '#f39c12',
  HIGH: '#e74c3c',
  CRITICAL: '#c0392b'
};

@Component({
  selector: 'app-priority-badge',
  template: `
    <span class="badge" [style.background]="color()">
      {{ priority() }}
    </span>
  `,
  styles: [`
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; color: #fff; font-size: 0.8rem; font-weight: 500; }
  `]
})
export class PriorityBadgeComponent {
  readonly priority = input.required<string>();
  readonly color = () => PRIORITY_COLORS[this.priority()] || '#95a5a6';
}
