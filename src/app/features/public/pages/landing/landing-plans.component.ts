import { Component } from '@angular/core';
import { ScrollAnimationDirective } from '../../../../shared/directives/scroll-animation.directive';

interface Plan {
  name: string; eyebrow: string; speed: string; price: string; popular?: boolean; features: string[];
}

@Component({
  selector: 'app-landing-plans',
  imports: [ScrollAnimationDirective],
  templateUrl: './landing-plans.component.html',
  styleUrl: './landing-plans.component.scss'
})
export class LandingPlansComponent {
  readonly plans: Plan[] = [
    { name: 'Hogar Básico', eyebrow: 'Hogar básico', speed: '50', price: '79', features: ['50 Mbps de descarga', '25 Mbps de subida', 'Router WiFi 5', 'Instalación gratuita'] },
    { name: 'Hogar Plus', eyebrow: 'Hogar plus', speed: '100', price: '99', popular: true, features: ['100 Mbps de descarga', '50 Mbps de subida', 'Router WiFi 6', 'Instalación gratuita', 'Soporte prioritario'] },
    { name: 'Hogar Premium', eyebrow: 'Hogar premium', speed: '300', price: '139', features: ['300 Mbps de descarga', '150 Mbps de subida', 'Router WiFi 6 Pro', 'Instalación gratuita', 'Soporte 24/7'] },
    { name: 'Hogar Avanzado', eyebrow: 'Hogar avanzado', speed: '500', price: '199', features: ['500 Mbps simétricos', 'Router WiFi 6E', 'Telefonía + móvil', 'Soporte 24/7 prioritario', 'Estático IPv4/IPv6'] },
  ];
}
