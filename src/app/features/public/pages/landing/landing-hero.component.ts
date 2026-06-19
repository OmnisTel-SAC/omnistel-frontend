import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountUpService } from '../../../../shared/services/count-up.service';
import { ScrollAnimationDirective } from '../../../../shared/directives/scroll-animation.directive';

@Component({
  selector: 'app-landing-hero',
  imports: [RouterLink, ScrollAnimationDirective],
  templateUrl: './landing-hero.component.html',
  styleUrl: './landing-hero.component.scss'
})
export class LandingHeroComponent implements OnInit {
  private countUp = inject(CountUpService);

  @ViewChild('speedContainer', { static: false }) speedContainer!: ElementRef;

  readonly features = [
    '1 Gbps simétrico',
    'IP fija incluida',
    'Sin permanencia mínima',
    'Soporte prioritario 24/7'
  ];

  ngOnInit() {
    this.animateSpeedMetrics();
  }

  private animateSpeedMetrics() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            const metrics = [
              { el: document.getElementById('speed-download'), end: 987, suffix: ' Mbps' },
              { el: document.getElementById('speed-upload'), end: 985, suffix: ' Mbps' },
              { el: document.getElementById('speed-ping'), end: 3, suffix: ' ms' },
              { el: document.getElementById('speed-jitter'), end: 0, suffix: ' ms' },
            ];
            metrics.forEach(m => {
              if (m.el) {
                m.el.dataset['suffix'] = m.suffix;
                this.countUp.animateValue(m.el, 0, m.end, 2000);
              }
            });
          }, 500);
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    setTimeout(() => {
      const wrapper = document.querySelector('.hero__card-wrapper');
      if (wrapper) observer.observe(wrapper);
    }, 0);
  }
}
