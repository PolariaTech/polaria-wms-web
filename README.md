# Polaria WMS Web

**Versión de producto: 2.4.3**

Frontend web del **Sistema de Gestión de Almacenes (WMS)** Polaria. Construido con [Next.js 16](https://nextjs.org), React 19 y TypeScript.

Arquitectura modular por dominios WMS, con tres scopes de aplicación: **plataforma** (configurador), **tenant** (dashboard operativo) y **administración de cuenta**.

## Inicio rápido

```bash
npm install
cp .env.example .env    # configurar API, Supabase y Mateo
npm run dev
```

Abre [http://localhost:3001/login](http://localhost:3001/login) en el navegador.

### Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | URL del backend `polaria-wms-api` |
| `NEXT_PUBLIC_MATEO_URL` | URL del chatbot Mateo IA (SSO handoff) |
| `NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL` | Bundle del chat flotante (ver [docs/MATEO-WIDGET.md](docs/MATEO-WIDGET.md)) |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase (lecturas con RLS) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |

Ver [docs/AUTH.md](docs/AUTH.md) (login + SSO) y [docs/MATEO-WIDGET.md](docs/MATEO-WIDGET.md) (widget embebido).

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (puerto **3001**) |
| `npm run dev:webpack` | Desarrollo con bundler Webpack |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción (puerto **3001**) |
| `npm run lint` | Análisis estático con ESLint |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:watch` | Vitest en modo watch |

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Lenguaje | TypeScript 5 |
| Estado global | Zustand |
| Datos | Supabase (`@supabase/ssr`, RLS) + REST API (`polaria-wms-api`) |
| Tests | Vitest, Testing Library |
| Iconos | Lucide React |
| Teléfonos | libphonenumber-js, react-phone-number-input |

## Arquitectura

### Capas de `src/`

| Carpeta | Responsabilidad |
|---------|-----------------|
| `app/` | Rutas Next.js (páginas delgadas, layouts, route handlers) |
| `components/` | UI reutilizable (`auth`, `layouts`, `shared`; `ui` y `forms` reservados) |
| `modules/` | Lógica de negocio por dominio WMS (components, services, types, `index.ts`) |
| `lib/` | Utilidades, auth client-side, capa Supabase (`domain-query`) |
| `services/` | Cliente HTTP (`api.ts`) y fachada Supabase |
| `hooks/` | Hooks transversales (permisos, tenant list, realtime) |
| `constants/` | Roles, permisos, labels WMS, países teléfono |
| `config/` | Env, rutas (`routes.ts`), navegación por rol |
| `providers/` | `AuthProvider`, `CompanyProvider` |
| `stores/` | `auth.store` (Zustand) |
| `types/` | Tipos compartidos (`auth`, `layout`) |
| `styles/` | Paleta Polaria (`polaria-palette.md`) |
| `test/` | Setup Vitest y mocks Supabase |

### Scopes de la aplicación

| Scope | Ruta base | Módulo principal | Guard |
|-------|-----------|------------------|-------|
| Platform | `/configurador` | `configurator` | `PlatformScopeGuard` |
| Tenant | `/dashboard` | `dashboard` + operativos | `TenantScopeGuard` |
| Admin cuenta | `/dashboard/administracion` | `admin-panel` | `AdminAccountGuard` |

### Módulos de dominio (`src/modules/`)

| Módulo | Área | Estado |
|--------|------|--------|
| `auth` | Login, SSO, sesión, resolución de tenant | Implementado (services; UI en `components/auth`) |
| `configurator` | Alta de cuentas, bodegas y usuarios (plataforma) | Implementado |
| `admin-panel` | Proveedores, compradores, camiones, catálogo, reportes, vinculación de bodegas | Implementado |
| `dashboard` | Home, widgets por rol, switch admin/operativo | Implementado |
| `inventory` | Mapa de inventario en tiempo real | Implementado |
| `purchases` | Ingreso: solicitudes, órdenes y recepciones de compra | Implementado |
| `sales` | Órdenes de venta | Implementado |
| `processing` | Solicitudes de procesamiento y tareas en cola | Implementado |
| `transport` | Guías de envío y evidencias | Implementado |
| `audit` | Auditoría de operaciones | Solo service |
| `users`, `companies`, `warehouses`, `accounts` | Reservados | Stub (README) |

### Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/login` | Flujo de autenticación (prelogin → contraseña → éxito) |
| `/auth/sso` | Intercambio SSO con Mateo |
| `/configurador` | Panel configurador de plataforma |
| `/configurador/creacion/*` | Cuentas, bodegas internas/externas |
| `/configurador/asignacion/usuarios` | Asignación de usuarios cross-cuenta |
| `/dashboard` | Home o panel admin según rol |
| `/dashboard/ingreso` | Compras (solicitudes, órdenes, recepciones) |
| `/dashboard/ventas` | Órdenes de venta |
| `/dashboard/procesamiento` | Procesamiento y cola de tareas |
| `/dashboard/transporte` | Guías y evidencias |
| `/dashboard/mapa` | Inventario en vivo por ubicación |
| `/dashboard/reporteria` | Reporte de inventario de mercancía |
| `/dashboard/administracion/*` | CRUD admin, catálogo, asignación |

### Convenciones

- Las páginas en `app/` delegan en componentes de `modules/` (máximo cableado de router y shell).
- Los módulos exponen su API pública vía `index.ts` (barrel export).
- Los módulos no se importan entre sí; lo compartido va en `components/shared`, `constants/` o `lib/`.
- Import alias: `@/` → `src/`.

```typescript
import { ProveedoresListView } from '@/modules/admin-panel';
import { ROLES } from '@/constants/roles';
import { PolariaDataTable } from '@/components/shared/PolariaDataTable';
```

## Estado actual

- **Auth / Login:** flujo completo (prelogin, login, logout, SSO Mateo, guards por scope y rol).
- **Configurador (platform):** cuentas, bodegas, usuarios con tests.
- **Admin panel (tenant):** proveedores, compradores, camiones, usuarios, bodegas, catálogo de productos, reportes.
- **Dashboard operativo:** ingreso, ventas, procesamiento, transporte, mapa en tiempo real, reportería.
- **Infraestructura:** Supabase RLS vía `domain-query`, API REST, 211 tests Vitest.
- **Pendiente:** módulos stub (`users`, `companies`, `warehouses`, `accounts`), integración configurador, primitivos `ui/` y `forms/`.

## Documentación adicional

| Archivo | Contenido |
|---------|-----------|
| [docs/AUTH.md](docs/AUTH.md) | Flujo de autenticación |
| [docs/POL-31-SHELL.md](docs/POL-31-SHELL.md) | Shell de la aplicación |
| [src/modules/README.md](src/modules/README.md) | Convenciones de módulos |
| [src/styles/polaria-palette.md](src/styles/polaria-palette.md) | Sistema visual Polaria |
| [.cursor/rules/polaria-design-system.mdc](.cursor/rules/polaria-design-system.mdc) | Reglas de diseño para agentes |

Cada carpeta principal dentro de `src/` incluye su propio `README.md` con detalles de propósito y convenciones.

## Árbol del proyecto

Árbol completo de archivos y carpetas con contenido. Excluye `node_modules/`, `.next/`, `.git/`, archivos `.gitkeep` y `.env` (local, no versionado).

```
polaria-wms-web/
├── .cursor/
│   └── rules/
│       └── polaria-design-system.mdc
├── docs/
│   ├── AUTH.md
│   └── POL-31-SHELL.md
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.png
│   ├── next.svg
│   ├── README.md
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── auth/
│   │   │   │   └── sso/
│   │   │   │       └── page.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (shell)/
│   │   │   ├── configurador/
│   │   │   │   ├── asignacion/
│   │   │   │   │   ├── usuarios/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── creacion/
│   │   │   │   │   ├── bodega-externa/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── bodega-interna/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── cuentas/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── integracion/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.test.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── administracion/
│   │   │   │   │   ├── asignacion-creacion/
│   │   │   │   │   │   ├── bodega-externa/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── bodega-interna/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── camiones/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── compradores/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── proveedores/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── usuarios/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── catalogo/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── ingreso/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── mapa/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── procesamiento/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reporteria/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── transporte/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── ventas/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── operational-pages.test.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── platform/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── login/
│   │   │   └── resolve-tenant/
│   │   │       └── route.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── README.md
│   ├── assets/
│   │   ├── icons/
│   │   │   └── README.md
│   │   ├── images/
│   │   │   └── README.md
│   │   └── README.md
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AdminAccountGuard.tsx
│   │   │   ├── AuthGuard.test.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   ├── AuthSessionBootstrap.tsx
│   │   │   ├── AuthSessionScript.tsx
│   │   │   ├── BodegaRequiredGuard.test.tsx
│   │   │   ├── BodegaRequiredGuard.tsx
│   │   │   ├── LoginFlow.test.tsx
│   │   │   ├── LoginFlow.tsx
│   │   │   ├── LoginStepPassword.tsx
│   │   │   ├── LoginStepSuccess.tsx
│   │   │   ├── LoginStepUser.tsx
│   │   │   ├── PlatformScopeGuard.test.tsx
│   │   │   ├── PlatformScopeGuard.tsx
│   │   │   ├── README.md
│   │   │   ├── RoleGate.test.tsx
│   │   │   ├── RoleGate.tsx
│   │   │   ├── SsoFlow.test.tsx
│   │   │   ├── SsoFlow.tsx
│   │   │   ├── TenantScopeGuard.test.tsx
│   │   │   └── TenantScopeGuard.tsx
│   │   ├── forms/
│   │   │   └── README.md
│   │   ├── layouts/
│   │   │   ├── AppShellLayout.test.tsx
│   │   │   ├── AppShellLayout.tsx
│   │   │   ├── AppTopbar.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   └── README.md
│   │   ├── shared/
│   │   │   ├── formatters.ts
│   │   │   ├── ModuleListPage.test.tsx
│   │   │   ├── ModuleListPage.tsx
│   │   │   ├── ModulePlaceholder.tsx
│   │   │   ├── ModuleRoleGate.tsx
│   │   │   ├── OperationalModuleShell.tsx
│   │   │   ├── PolariaDataTable.test.tsx
│   │   │   ├── PolariaDataTable.tsx
│   │   │   ├── PolariaFormField.tsx
│   │   │   ├── PolariaFormModal.test.tsx
│   │   │   ├── PolariaFormModal.tsx
│   │   │   ├── PolariaPhoneInput.tsx
│   │   │   ├── PolariaSelectionCard.tsx
│   │   │   ├── PolariaTableCells.tsx
│   │   │   └── README.md
│   │   ├── ui/
│   │   │   └── README.md
│   │   └── README.md
│   ├── config/
│   │   ├── env.ts
│   │   ├── navigation-role-gate.integration.test.ts
│   │   ├── navigation.test.ts
│   │   ├── navigation.ts
│   │   ├── README.md
│   │   ├── routes.test.ts
│   │   └── routes.ts
│   ├── constants/
│   │   ├── brand.ts
│   │   ├── permissions.ts
│   │   ├── phone-countries.test.ts
│   │   ├── phone-countries.ts
│   │   ├── README.md
│   │   ├── roles.ts
│   │   └── wms-roles.ts
│   ├── hooks/
│   │   ├── README.md
│   │   ├── useAsyncQuery.ts
│   │   ├── useLiveDate.ts
│   │   ├── usePermissions.test.tsx
│   │   ├── usePermissions.ts
│   │   ├── useTenantList.ts
│   │   ├── useWarehouseStateRealtime.test.tsx
│   │   └── useWarehouseStateRealtime.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── domain-query.ts
│   │   ├── active-bodega.ts
│   │   ├── auth-broadcast.ts
│   │   ├── auth-context.ts
│   │   ├── auth-hash-import.test.ts
│   │   ├── auth-hash-import.ts
│   │   ├── auth-routes.test.ts
│   │   ├── auth-routes.ts
│   │   ├── auth-session.ts
│   │   ├── auth-storage.test.ts
│   │   ├── auth-storage.ts
│   │   ├── auth-sync.test.ts
│   │   ├── auth-sync.ts
│   │   ├── cn.ts
│   │   ├── domain-service-error.test.ts
│   │   ├── domain-service-error.ts
│   │   ├── generate-codigo-cuenta.test.ts
│   │   ├── generate-codigo-cuenta.ts
│   │   ├── mateo-sso-exit.test.ts
│   │   ├── mateo-sso-exit.ts
│   │   ├── normalize-nivel-rol.test.ts
│   │   ├── normalize-nivel-rol.ts
│   │   ├── README.md
│   │   ├── tenant-headers.test.ts
│   │   └── tenant-headers.ts
│   ├── modules/
│   │   ├── accounts/
│   │   │   └── README.md
│   │   ├── admin-panel/
│   │   │   ├── components/
│   │   │   │   ├── AdminAssignmentCreationPanel.test.tsx
│   │   │   │   ├── AdminAssignmentCreationPanel.tsx
│   │   │   │   ├── AdminBreadcrumb.tsx
│   │   │   │   ├── AdminCatalogListShell.tsx
│   │   │   │   ├── AdminMenuRowCard.tsx
│   │   │   │   ├── AdminMenuSection.tsx
│   │   │   │   ├── AdminPanel.tsx
│   │   │   │   ├── AdminPanelActionsGrid.tsx
│   │   │   │   ├── AdminPanelHeader.tsx
│   │   │   │   ├── BodegaExternaAdminView.tsx
│   │   │   │   ├── BodegaInternaAdminView.tsx
│   │   │   │   ├── CamionCreateModal.tsx
│   │   │   │   ├── CamionesListView.tsx
│   │   │   │   ├── CatalogoFormFields.tsx
│   │   │   │   ├── CatalogoListView.tsx
│   │   │   │   ├── CompradorCreateModal.tsx
│   │   │   │   ├── CompradoresListView.tsx
│   │   │   │   ├── InventarioMercanciaFlow.tsx
│   │   │   │   ├── InventarioMercanciaReportView.tsx
│   │   │   │   ├── ProductoCatalogoCreateModal.tsx
│   │   │   │   ├── ProductoSecundarioCreateModal.tsx
│   │   │   │   ├── ProveedorCreateModal.tsx
│   │   │   │   ├── ProveedoresListView.tsx
│   │   │   │   ├── UsuarioAdminCreateModal.tsx
│   │   │   │   ├── UsuariosAdminListView.tsx
│   │   │   │   ├── VincularBodegaExternaModal.tsx
│   │   │   │   └── VincularBodegaInternaModal.tsx
│   │   │   ├── constants/
│   │   │   │   ├── admin-assignment-creation-options.test.ts
│   │   │   │   ├── admin-assignment-creation-options.ts
│   │   │   │   ├── admin-catalog-list.ts
│   │   │   │   ├── admin-panel-actions.test.ts
│   │   │   │   ├── admin-panel-actions.ts
│   │   │   │   ├── camion-types.ts
│   │   │   │   └── catalogo-producto.ts
│   │   │   ├── services/
│   │   │   │   ├── bodegas-externas-admin.service.test.ts
│   │   │   │   ├── bodegas-externas-admin.service.ts
│   │   │   │   ├── bodegas-internas-admin.service.test.ts
│   │   │   │   ├── bodegas-internas-admin.service.ts
│   │   │   │   ├── camiones.service.test.ts
│   │   │   │   ├── camiones.service.ts
│   │   │   │   ├── compradores.service.test.ts
│   │   │   │   ├── compradores.service.ts
│   │   │   │   ├── inventario-mercancia-report.service.test.ts
│   │   │   │   ├── inventario-mercancia-report.service.ts
│   │   │   │   ├── productos-catalogo.service.test.ts
│   │   │   │   ├── productos-catalogo.service.ts
│   │   │   │   ├── proveedores.service.test.ts
│   │   │   │   ├── proveedores.service.ts
│   │   │   │   ├── usuarios-admin.service.test.ts
│   │   │   │   └── usuarios-admin.service.ts
│   │   │   ├── types/
│   │   │   │   ├── admin-assignment-creation.types.ts
│   │   │   │   └── admin-panel.types.ts
│   │   │   └── index.ts
│   │   ├── audit/
│   │   │   ├── services/
│   │   │   │   ├── audit.service.test.ts
│   │   │   │   └── audit.service.ts
│   │   │   ├── types/
│   │   │   │   └── audit.types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   ├── auth/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.test.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── login-tenant-context.service.test.ts
│   │   │   │   └── login-tenant-context.service.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   ├── companies/
│   │   │   └── README.md
│   │   ├── configurator/
│   │   │   ├── components/
│   │   │   │   ├── AssignmentOptionsGrid.tsx
│   │   │   │   ├── AssignmentPanel.test.tsx
│   │   │   │   ├── AssignmentPanel.tsx
│   │   │   │   ├── BodegaExternaCreateModal.tsx
│   │   │   │   ├── BodegaExternaListView.tsx
│   │   │   │   ├── BodegaInternaCreateModal.test.tsx
│   │   │   │   ├── BodegaInternaCreateModal.tsx
│   │   │   │   ├── BodegaInternaListView.tsx
│   │   │   │   ├── ConfiguratorActionCard.tsx
│   │   │   │   ├── ConfiguratorActionsGrid.test.tsx
│   │   │   │   ├── ConfiguratorActionsGrid.tsx
│   │   │   │   ├── ConfiguratorBreadcrumb.tsx
│   │   │   │   ├── ConfiguratorHeader.tsx
│   │   │   │   ├── ConfiguratorListShell.tsx
│   │   │   │   ├── ConfiguratorPanel.tsx
│   │   │   │   ├── CreationOptionsGrid.tsx
│   │   │   │   ├── CreationPanel.test.tsx
│   │   │   │   ├── CreationPanel.tsx
│   │   │   │   ├── CuentaCreateModal.test.tsx
│   │   │   │   ├── CuentaCreateModal.tsx
│   │   │   │   ├── CuentasListView.tsx
│   │   │   │   ├── UsuarioCreateModal.tsx
│   │   │   │   └── UsuariosListView.tsx
│   │   │   ├── constants/
│   │   │   │   ├── assignment-options.ts
│   │   │   │   ├── configurator-actions.test.ts
│   │   │   │   ├── configurator-actions.ts
│   │   │   │   ├── configurator-list.ts
│   │   │   │   ├── creation-options.ts
│   │   │   │   ├── usuario-rol-asignacion.test.ts
│   │   │   │   └── usuario-rol-asignacion.ts
│   │   │   ├── services/
│   │   │   │   ├── bodegas-externas.service.test.ts
│   │   │   │   ├── bodegas-externas.service.ts
│   │   │   │   ├── bodegas-internas.service.test.ts
│   │   │   │   ├── bodegas-internas.service.ts
│   │   │   │   ├── cuentas.service.test.ts
│   │   │   │   ├── cuentas.service.ts
│   │   │   │   ├── usuarios.service.test.ts
│   │   │   │   └── usuarios.service.ts
│   │   │   ├── types/
│   │   │   │   ├── assignment.types.ts
│   │   │   │   ├── configurator.types.ts
│   │   │   │   └── creation.types.ts
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── DashboardHome.test.tsx
│   │   │   │   ├── DashboardHome.tsx
│   │   │   │   ├── DashboardPageContent.test.tsx
│   │   │   │   ├── DashboardPageContent.tsx
│   │   │   │   └── DashboardWidget.tsx
│   │   │   ├── constants/
│   │   │   │   ├── dashboard-widgets.test.ts
│   │   │   │   └── dashboard-widgets.ts
│   │   │   ├── services/
│   │   │   │   └── dashboard-data.ts
│   │   │   ├── types/
│   │   │   │   └── dashboard.types.ts
│   │   │   └── index.ts
│   │   ├── inventory/
│   │   │   ├── components/
│   │   │   │   └── MapaInventarioPageContent.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useWarehouseStateSubscription.ts
│   │   │   ├── services/
│   │   │   │   ├── inventory.service.test.ts
│   │   │   │   └── inventory.service.ts
│   │   │   ├── types/
│   │   │   │   └── inventory.types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   ├── processing/
│   │   │   ├── components/
│   │   │   │   └── ProcesamientoPageContent.tsx
│   │   │   ├── services/
│   │   │   │   ├── processing.service.test.ts
│   │   │   │   └── processing.service.ts
│   │   │   ├── types/
│   │   │   │   └── processing.types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   ├── purchases/
│   │   │   ├── components/
│   │   │   │   └── IngresoPageContent.tsx
│   │   │   ├── services/
│   │   │   │   ├── purchases.service.test.ts
│   │   │   │   └── purchases.service.ts
│   │   │   ├── types/
│   │   │   │   └── purchases.types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   ├── sales/
│   │   │   ├── components/
│   │   │   │   └── VentasPageContent.tsx
│   │   │   ├── services/
│   │   │   │   ├── sales.service.test.ts
│   │   │   │   └── sales.service.ts
│   │   │   ├── types/
│   │   │   │   └── sales.types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   ├── transport/
│   │   │   ├── components/
│   │   │   │   └── TransportePageContent.tsx
│   │   │   ├── services/
│   │   │   │   ├── transport.service.test.ts
│   │   │   │   └── transport.service.ts
│   │   │   ├── types/
│   │   │   │   └── transport.types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   ├── users/
│   │   │   └── README.md
│   │   ├── warehouses/
│   │   │   └── README.md
│   │   └── README.md
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── CompanyProvider.test.tsx
│   │   ├── CompanyProvider.tsx
│   │   └── README.md
│   ├── services/
│   │   ├── api.test.ts
│   │   ├── api.ts
│   │   ├── README.md
│   │   └── supabase.ts
│   ├── stores/
│   │   ├── auth.store.test.ts
│   │   ├── auth.store.ts
│   │   └── README.md
│   ├── styles/
│   │   ├── polaria-palette.md
│   │   └── README.md
│   ├── test/
│   │   ├── create-supabase-mock.ts
│   │   └── setup.ts
│   ├── types/
│   │   ├── auth.test.ts
│   │   ├── auth.ts
│   │   ├── index.ts
│   │   ├── layout.ts
│   │   └── README.md
│   └── README.md
├── .env.example
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── vitest.config.ts
```
