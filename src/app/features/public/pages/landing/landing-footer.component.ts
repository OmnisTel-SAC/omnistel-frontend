import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-footer',
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.scss'
})
export class LandingFooterComponent {
  readonly columns = [
    { title: 'Servicios', links: ['Internet Hogar', 'Internet Empresas', 'Telefonía IP', 'Enlaces P2P'] },
    { title: 'Compañía', links: ['Sobre nosotros', 'Cobertura', 'Trabaja con nosotros', 'Prensa'] },
    { title: 'Soporte', links: ['Centro de ayuda', 'Estado del servicio', 'Términos y condiciones', 'Política de privacidad'] },
  ];
}
