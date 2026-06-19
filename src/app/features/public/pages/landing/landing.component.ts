import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingTopbarComponent } from './landing-topbar.component';
import { LandingHeroComponent } from './landing-hero.component';
import { LandingPlansComponent } from './landing-plans.component';
import { LandingFooterComponent } from './landing-footer.component';
import { ScrollAnimationDirective } from '../../../../shared/directives/scroll-animation.directive';
import { CountUpService } from '../../../../shared/services/count-up.service';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, LandingTopbarComponent, LandingHeroComponent, LandingPlansComponent, LandingFooterComponent, ScrollAnimationDirective],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private countUp = inject(CountUpService);
  openFaq: number | null = null;

  readonly stats = [
    { number: '50,000+', label: 'Clientes activos', end: 50000 },
    { number: '250+', label: 'Colaboradores', end: 250 },
    { number: 'Desde 2018', label: 'En el mercado', end: 2018 },
    { number: 'Lima Met.', label: 'Cobertura en expansión', end: 1 },
  ];

  readonly trustItems = [
    { icon: 'pi-bolt', text: 'Instalación en 48h' },
    { icon: 'pi-shield', text: 'SLA 99.9% garantizado' },
    { icon: 'pi-headphones', text: 'Soporte 24/7/365' },
    { icon: 'pi-sync', text: 'Red simétrica FTTH' },
  ];

  readonly services = [
    { icon: 'pi-globe', title: 'Internet Dedicado', desc: 'Ancho de banda garantizado simétrico de 50 Mbps a 1 Gbps con IP fija.' },
    { icon: 'pi-share-alt', title: 'Enlaces Punto a Punto', desc: 'Conectividad privada y segura entre sedes empresariales con baja latencia.' },
    { icon: 'pi-phone', title: 'Centrales Telefónicas IP', desc: 'Comunicaciones unificadas, anexos ilimitados y movilidad para tu equipo.' },
    { icon: 'pi-headphones', title: 'Soporte 24/7', desc: 'Atención prioritaria con SLA garantizado y NOC monitoreando tu enlace.' },
    { icon: 'pi-server', title: 'Housing & Cloud', desc: 'Infraestructura en data centers Tier III con redundancia y respaldo.' },
    { icon: 'pi-shield', title: 'Ciberseguridad', desc: 'Firewall gestionado, anti-DDoS y monitoreo perimetral 24/7.' },
  ];

  readonly cities = ['Lima', 'Callao', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Cusco', 'Ica', 'Huancayo', 'Tacna'];

  readonly categories = [
    { icon: 'pi-globe', title: 'Sin conexión', prio: 'Alta', color: 'text-prio-high' },
    { icon: 'pi-gauge', title: 'Velocidad lenta', prio: 'Media', color: 'text-prio-medium' },
    { icon: 'pi-server', title: 'Problemas con el router', prio: 'Alta', color: 'text-prio-high' },
    { icon: 'pi-wrench', title: 'Instalación técnica', prio: 'Media', color: 'text-prio-medium' },
    { icon: 'pi-arrow-right-arrow-left', title: 'Cambio de plan', prio: 'Baja', color: 'text-prio-low' },
    { icon: 'pi-credit-card', title: 'Facturación y pagos', prio: 'Media', color: 'text-prio-medium' },
    { icon: 'pi-phone', title: 'Problemas de telefonía', prio: 'Alta', color: 'text-prio-high' },
    { icon: 'pi-calendar', title: 'Mantenimientos', prio: 'Baja', color: 'text-prio-low' },
  ];

  readonly contacts = [
    { icon: 'pi-phone', title: 'Ventas Empresas', value: '(01) 700-1234' },
    { icon: 'pi-envelope', title: 'Email comercial', value: 'ventas@omnistel.com.pe' },
    { icon: 'pi-map-marker', title: 'Oficina central', value: 'Av. Javier Prado 1200, San Isidro' },
  ];

  readonly faqs = [
    { q: '¿No puedes iniciar sesión?', a: 'Verifica que tu correo y contraseña sean correctos. Si olvidaste tu contraseña, usa la opción "Recuperar contraseña" en la pantalla de login. Si el problema persiste, contáctanos al 0800-12345.' },
    { q: '¿Qué opciones de acceso hay?', a: 'Ofrecemos acceso por correo y contraseña al portal de cliente. Próximamente sumaremos verificación en dos pasos por SMS y acceso con Google.' },
    { q: '¿Cómo contactar soporte técnico?', a: 'Puedes crear un ticket desde tu portal, escribirnos a soporte@omnistel.com.pe o llamarnos las 24 horas al 0800-12345. Atención prioritaria para clientes empresariales.' },
    { q: '¿Cerrar sesión en todos los dispositivos?', a: 'Ingresa a "Mi Perfil" → "Seguridad" y selecciona "Cerrar sesión en todos los dispositivos". Esto invalidará todas las sesiones activas.' },
    { q: '¿Cómo verifico si hay cobertura en mi dirección?', a: 'Usa el verificador en la sección "Cobertura" de esta página. Te confirmaremos disponibilidad de fibra y velocidades en tu zona.' },
  ];

  ngOnInit() {
    this.initStatsAnimation();
  }

  private initStatsAnimation() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll('[data-count]');
          items.forEach(el => {
            const htmlEl = el as HTMLElement;
            const end = parseInt(htmlEl.dataset['count'] ?? '0', 10);
            this.countUp.animateValue(htmlEl, 0, end, 2000);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    setTimeout(() => {
      const band = document.querySelector('.stats-band');
      if (band) observer.observe(band);
    }, 0);
  }

  toggleFaq(index: number) {
    this.openFaq = this.openFaq === index ? null : index;
  }
}
