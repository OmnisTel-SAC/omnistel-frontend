import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-topbar',
  imports: [RouterLink],
  templateUrl: './landing-topbar.component.html',
  styleUrl: './landing-topbar.component.scss'
})
export class LandingTopbarComponent {
  scrolled = signal(false);
  menuOpen = false;

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 50);
  }
}
