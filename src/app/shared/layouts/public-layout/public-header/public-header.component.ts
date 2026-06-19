import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink],
  template: `
    <header>
      <nav>
        <a routerLink="/" class="logo">OmnisTel</a>
        <div class="nav-links">
          <a routerLink="/login">Iniciar Sesión</a>
          <a routerLink="/register">Registrarse</a>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    header { background: var(--color-dark); padding: 1rem 2rem; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }
    .logo { color: var(--color-primary); font-size: 1.5rem; font-weight: bold; text-decoration: none; }
    .nav-links a { color: var(--color-white); margin-left: 1.5rem; text-decoration: none; }
    .nav-links a:hover { color: var(--color-primary); }
  `]
})
export class PublicHeaderComponent {}
