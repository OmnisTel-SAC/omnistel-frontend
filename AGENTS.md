# OmnisTel Frontend — Resumen para Agentes

## Stack
Angular 21 standalone + PrimeNG 21 + PrimeIcons + Signals + ReactiveForms + SCSS (@use)

## Estructura Final (`omnistel-frontend/`)
```
src/
├── app/
│   ├── app.ts / app.html / app.scss     → <p-toast /> + <router-outlet />, standalone
│   ├── app.config.ts                    → HTTP interceptors, PrimeNG Aura theme, animations
│   ├── app.routes.ts                    → Lazy loading por módulo (public, client, agent, admin, notifications)
│   ├── core/
│   │   ├── models/                      → auth, ticket, attachment, notification, paged-response
│   │   ├── guards/                      → auth.guard.ts, role.guard.ts
│   │   ├── interceptors/                → auth.interceptor.ts, error.interceptor.ts
│   │   ├── services/                    → auth, notification, client-ticket, agent-ticket, admin-ticket, admin-user
│   │   └── stores/                      → auth.store.ts (signals + localStorage), notification.store.ts
│   ├── shared/
│   │   ├── layouts/
│   │   │   ├── public-layout/           → PublicLayoutComponent (header + router-outlet + footer)
│   │   │   └── private-layout/          → PrivateLayoutComponent (sidebar + topbar + notification-bell + router-outlet)
│   │   ├── components/                  → status-badge, priority-badge, loading-spinner, file-upload, file-attachment, ticket-card
│   │   └── utils/                       → validators.ts, formatters.ts
│   └── features/                        → public, client, agent, admin, notifications, profile (todos lazy loading)
├── assets/styles/                       → _variables.scss, _theme.scss, global.scss
├── environments/                        → environment.ts, environment.prod.ts
├── proxy.conf.json                      → /api → localhost:8050
├── angular.json                         → @angular/build:application, primeicons CSS, 600kB budget
└── package.json                         → name: omnistel-frontend
```

## Errores Resueltos
- `primeng/overlaypanel` → `primeng/overlay` (OverlayModule, no OverlayPanelModule; usar .show()/.hide() sin event arg)
- `@primeng/themes/aura` → instalar `@primeng/themes@^21.0.0`
- `@angular/animations/browser` → instalar `@angular/animations@^21.0.0`
- Store imports en private-layout → corregir a 4 niveles `../../../../core/stores/`
- `API_TICKETS` / `API_AUTH` no exportados → agregar constantes en `core/models/auth.ts`
- `app-public-layout` no reconocido → cambiar a route shell pattern en `public.routes.ts`
- Sass `@import` deprecado → migrar a `@use`
- TicketStatus type → importar y castear correctamente

## Rutas
| Path | Módulo | Guard |
|------|--------|-------|
| `/` | Landing | — |
| `/login` | Login | — |
| `/register` | Register | — |
| `/client` | Client Dashboard | auth + CLIENT |
| `/client/tickets` | Client Tickets | auth + CLIENT |
| `/client/tickets/:id` | Client Ticket Detail | auth + CLIENT |
| `/agent` | Agent Dashboard | auth + AGENT |
| `/agent/tickets` | Agent Tickets | auth + AGENT |
| `/agent/tickets/:id` | Agent Ticket Detail | auth + AGENT |
| `/admin` | Admin Dashboard | auth + ADMIN |
| `/admin/tickets` | Admin Tickets | auth + ADMIN |
| `/admin/users` | Admin Users | auth + ADMIN |
| `/notifications` | Notifications | auth |
| `**` | → redirect `/` | — |

## Layout Pattern
- **Público**: `PublicLayoutComponent` como route shell con children (landing, login, register)
- **Privado**: Los módulos protegidos usan `PrivateLayoutComponent` directamente como route shell
- **App raíz**: solo `<p-toast />` + `<router-outlet />`

## Pendiente (Fase 2+)
- Replicar diseño de `IMAGEN VISUAL.png` (landing, login, register)
- Implementar dashboards reales con KPIs, tablas, formularios
- Conexión real con backend via proxy.conf.json
- Pruebas unitarias
