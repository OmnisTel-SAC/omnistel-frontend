# OmnisTel Frontend

Aplicación web Angular del sistema OmnisTel.
Interfaz de usuario para clientes, agentes y administradores con
notificaciones en tiempo real, gestión de tickets y dashboards.

## Tecnologías

- Angular 18+
- TypeScript
- PrimeNG (componentes UI)
- PrimeFlex (layout responsive)
- Chart.js (gráficos de dashboard)
- SCSS (estilos)
- SSE (Server-Sent Events para notificaciones en tiempo real)
- RxJS (programación reactiva)

## Estructura

```
omnistel-frontend/
├── src/
│   ├── app/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.ts
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   ├── models/
│   │   │   │   ├── attachment.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── comment.ts
│   │   │   │   ├── notification.ts
│   │   │   │   ├── paged-response.ts
│   │   │   │   └── ticket.ts
│   │   │   ├── pipes/
│   │   │   │   ├── priority.pipe.ts
│   │   │   │   └── status-label.pipe.ts
│   │   │   ├── services/
│   │   │   │   ├── admin-ticket.service.ts
│   │   │   │   ├── admin-user.service.ts
│   │   │   │   ├── agent-ticket.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── client-ticket.service.ts
│   │   │   │   ├── logger.service.ts
│   │   │   │   ├── notification-stream.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   └── stores/
│   │   │       ├── auth.store.ts
│   │   │       └── notification.store.ts
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   │   ├── admin.routes.ts
│   │   │   │   └── pages/
│   │   │   │       ├── dashboard/
│   │   │   │       ├── queue/
│   │   │   │       ├── ticket-detail/
│   │   │   │       ├── tickets/
│   │   │   │       └── users/
│   │   │   ├── agent/
│   │   │   │   ├── agent.routes.ts
│   │   │   │   └── pages/
│   │   │   │       ├── assigned-tickets/
│   │   │   │       ├── dashboard/
│   │   │   │       ├── ticket-detail/
│   │   │   │       └── tickets/
│   │   │   ├── client/
│   │   │   │   ├── client.routes.ts
│   │   │   │   └── pages/
│   │   │   │       ├── create-ticket/
│   │   │   │       ├── dashboard/
│   │   │   │       ├── my-tickets/
│   │   │   │       ├── ticket-detail/
│   │   │   │       └── tickets/
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.routes.ts
│   │   │   │   └── pages/
│   │   │   │       └── notifications-page.component.ts
│   │   │   └── public/
│   │   │       ├── public.routes.ts
│   │   │       └── pages/
│   │   │           ├── landing/
│   │   │           ├── login/
│   │   │           └── register/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── file-attachment/
│   │   │   │   ├── file-upload/
│   │   │   │   ├── loading-spinner/
│   │   │   │   ├── not-found/
│   │   │   │   ├── priority-badge/
│   │   │   │   ├── status-badge/
│   │   │   │   └── ticket-card/
│   │   │   ├── directives/
│   │   │   │   └── scroll-animation.directive.ts
│   │   │   ├── layouts/
│   │   │   │   ├── private-layout/
│   │   │   │   │   ├── notification-bell/
│   │   │   │   │   ├── sidebar/
│   │   │   │   │   └── topbar/
│   │   │   │   └── public-layout/
│   │   │   ├── services/
│   │   │   │   └── count-up.service.ts
│   │   │   └── utils/
│   │   │       ├── formatters.ts
│   │   │       └── validators.ts
│   │   └── assets/styles/
│   │       ├── _animations.scss
│   │       ├── _theme.scss
│   │       ├── _variables.scss
│   │       └── global.scss
│   ├── environments/
│   │   ├── environment.prod.ts
│   │   └── environment.ts
│   └── public/img/landing/
├── nginx.conf
├── Dockerfile
├── angular.json
├── package.json
└── .gitignore
```

## Patrones de Diseño

| Patrón | Descripción |
|--------|-------------|
| **Component-Based Architecture** | Componentes reutilizables y modulares con Angular |
| **Lazy Loading** | Carga diferida de módulos por rol (admin, agent, client) |
| **Guards / Route Protection** | `AuthGuard` y `RoleGuard` para proteger rutas según autenticación y rol |
| **Interceptor Pattern** | `AuthInterceptor` agrega JWT a cada request; `ErrorInterceptor` maneja errores HTTP |
| **State Management (Stores)** | `AuthStore` y `NotificationStore` para estado global reactivo |
| **SSE (Observer Pattern)** | `NotificationStreamService` para recibir notificaciones en tiempo real |
| **Service Layer** | Servicios dedicados por rol (admin-ticket, agent-ticket, client-ticket) |
| **DTO / Model Pattern** | Tipos TypeScript que reflejan los DTOs del backend |

## Infraestructura

| Componente | Uso |
|------------|-----|
| **Nginx** | Servidor web para producción (proxy reverso a API Gateway) |
| **API Gateway** | Único punto de entrada a los microservicios |

## Rutas Principales

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Landing page | Público |
| `/login` | Inicio de sesión | Público |
| `/register` | Registro de cliente | Público |
| `/client/*` | Panel de cliente | CLIENT |
| `/agent/*` | Panel de agente | AGENT |
| `/admin/*` | Panel de administrador | ADMIN |
| `/notifications` | Centro de notificaciones | Todos los roles |
| `/404` | Página no encontrada | Público |

## Puerto

- `4200` (desarrollo con `ng serve`)
- `80` (producción con Docker + Nginx)

## Dependencias

- **API Gateway** — todas las peticiones API pasan por el gateway en `8050`
- **Notification Service** — conexión SSE para notificaciones en tiempo real
