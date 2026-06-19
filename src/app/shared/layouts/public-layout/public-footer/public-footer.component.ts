import { Component } from '@angular/core';

@Component({
  selector: 'app-public-footer',
  template: `
    <footer>
      <p>&copy; 2026 OmnisTel S.A.C. Todos los derechos reservados.</p>
    </footer>
  `,
  styles: [`
    footer { background: var(--color-dark); color: var(--color-white); text-align: center; padding: 1rem; }
  `]
})
export class PublicFooterComponent {}
