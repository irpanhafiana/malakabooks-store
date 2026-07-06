# MalakaBooks Store — Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 21, standalone components, zoneless change detection |
| **Styling** | Tailwind CSS v4, self-hosted fonts (Inter, Poppins, Fraunces, Plus Jakarta Sans) |
| **Icons** | Boxicons (self-hosted via npm) |
| **UI Kit** | Custom component library (`src/app/shared/ui/`) — no Angular Material / Bootstrap |
| **State** | Signals + service-based stores (`src/app/store/`) |
| **HTTP** | `HttpClient` with functional interceptors (auth + loading) |
| **Maps** | Leaflet (`map-picker` component only) |
| **Carousel** | Embla Carousel |
| **Backend** | .NET 8+ API (solution in `/API/MalakaBooks.sln`) |
| **Auth** | IdentityServer4 (OAuth2, Resource Owner Password grant for now) |

## Project Structure (Frontend)

```
src/
├── app/
│   ├── app.ts, app.html, app.css         # Root component
│   ├── app.config.ts                     # App-wide providers
│   ├── app.routes.ts                     # Route definitions
│   ├── core/
│   │   ├── auth/                         # JWT decode, session util
│   │   ├── constants/                    # Shared constants
│   │   ├── guards/                       # Auth & admin guards
│   │   ├── interceptors/                 # HTTP interceptors
│   │   ├── models/                       # TypeScript interfaces (barrel via index.ts)
│   │   ├── services/                     # API services, alert/toast/logger
│   │   └── strategies/                   # Preloading strategies
│   ├── features/
│   │   ├── admin/                        # Admin CRUD (dashboard, products, orders…)
│   │   ├── auth/                         # Login, register, forgot-password, welcome
│   │   ├── cart/                         # Shopping cart
│   │   ├── checkout/                     # Checkout flow
│   │   ├── complaint/                    # Customer complaints
│   │   ├── home/                         # Landing page
│   │   ├── order/                        # Order history, detail-shipment, success
│   │   ├── product/                      # Product list & detail
│   │   └── profile/                      # User profile
│   ├── layouts/                          # Page layouts (admin, auth, customer, etc.)
│   ├── shared/
│   │   ├── directives/                   # Custom directives
│   │   ├── pipes/                        # Custom pipes
│   │   ├── ui/                           # Reusable UI components (design system)
│   │   └── util/                         # Utilities (CSV, pagination)
│   └── store/                            # Signal-based stores
├── environments/                         # Dev & prod config
├── fixtures/                             # Static mock data
└── styles.css                            # Global styles + Tailwind imports
```

## Key Design Decisions

- **Standalone components only** — no NgModules. Lazy-loaded via `loadComponent` in routes.
- **Zoneless** — `provideZonelessChangeDetection()`. Change detection driven by Signals.
- **Signals over RxJS** — stores use `signal`/`computed` instead of `BehaviorSubject`. RxJS used only for HTTP and router events.
- **Functional interceptors** — `HttpInterceptorFn` instead of class-based interceptors.
- **Selective preloading** — only customer-facing routes with `data: { preload: true }` are preloaded. Admin routes are lazy-on-demand.
