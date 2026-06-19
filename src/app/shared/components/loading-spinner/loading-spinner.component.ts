import { Component } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loading-spinner',
  imports: [ProgressSpinnerModule],
  template: `
    <div class="spinner-container">
      <p-progressSpinner />
    </div>
  `,
  styles: [`
    .spinner-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
  `]
})
export class LoadingSpinnerComponent {}
