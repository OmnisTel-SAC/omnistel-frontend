import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="not-found">
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <a routerLink="/" pButton label="Volver al inicio"></a>
    </div>
  `,
  styles: [`
    .not-found { text-align: center; padding: 4rem 2rem; }
    .not-found h1 { font-size: 5rem; margin: 0; color: var(--p-primary-color); }
    .not-found p { font-size: 1.2rem; margin: 1rem 0 2rem; color: #666; }
  `]
})
export class NotFoundComponent {}
