# Autenticación — Polaria WMS Web

Flujo de login en 3 escenas conectado al backend `polaria-wms-api`.

## Variables de entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | URL base del API de auth | `http://localhost:3000` |
| `NEXT_PUBLIC_MATEO_URL` | URL base del chatbot Mateo IA | `https://chatbot-mateo.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon de Supabase (RLS en cliente) | `eyJ...` |

En desarrollo, el frontend proxea las peticiones del navegador vía `/api/*` → backend, evitando errores de CORS cuando front y back corren en puertos distintos (ej. front `:3001`, back `:3000`).

## Contexto tenant (POL-2)

Tras `GET /auth/me`, el frontend persiste el contexto completo del tenant:

| Campo | Uso |
|-------|-----|
| `scope` | `platform` (configurador) o `tenant` (operación) |
| `codigoEmpresa` | Empresa activa del usuario |
| `codigoCuenta` | Cuenta comercial activa (si aplica) |
| `idBodegas` | Bodegas activas asignadas al usuario |
| `nivelRol` | Jerarquía del rol: `platform`, `empresa`, `cuenta`, `bodega` |

`CompanyProvider` (alias `TenantProvider`) expone estos valores vía `useCompany()` / `useTenant()`. Si el usuario tiene más de una bodega, el topbar muestra un selector (`TenantBodegaSelector`) y la bodega activa se recuerda en `localStorage` por usuario.

## API Nest vs cliente Supabase directo

| Criterio | API Nest (`polaria-wms-api`) | Supabase client (`@/lib/supabase/client`) |
|----------|------------------------------|-------------------------------------------|
| **Autenticación** | Bearer JWT del login WMS | Mismo JWT sincronizado con `syncSupabaseAuthSession` |
| **Cuándo usar** | Escrituras, reglas de negocio, transacciones, integraciones | Lecturas simples filtradas por RLS en tablas expuestas |
| **Validación** | DTOs, guards, TenantContext en servidor | Políticas RLS en Postgres |
| **Ejemplos** | Login, prelogin, logout, SSO Mateo, ingresos, movimientos | Listados de catálogo, lookups de ubicaciones, consultas read-only |

**Regla práctica:** operaciones que modifican estado o cruzan varias entidades → **API Nest**. Consultas de solo lectura donde RLS ya restringe por empresa/cuenta/bodega → **Supabase directo** con el cliente del navegador.

El cliente Supabase se crea con `createSupabaseBrowserClient()` y recibe la sesión del auth store (tokens emitidos por el API). Si faltan variables `NEXT_PUBLIC_SUPABASE_*`, las lecturas directas no se inicializan; el flujo de auth por API sigue funcionando.

## Guards de scope

| Guard | Rutas | Comportamiento |
|-------|-------|----------------|
| `AuthGuard` | Shell autenticado | Sin token → `/login` |
| `PlatformScopeGuard` | `/configurador` | Scope tenant → `/dashboard` |
| `TenantScopeGuard` | `/dashboard` (layout) | Scope platform → `/configurador`; scope ≠ tenant o sin `codigoEmpresa` → `/login` |
| `BodegaRequiredGuard` | Rutas que lo incluyan | Bodegas asignadas sin activa → `/dashboard` + selector |

Peticiones autenticadas al API Nest incluyen headers alineados con `TenantGuard` del backend: `X-Codigo-Empresa`, `X-Codigo-Cuenta` (si aplica) y `X-Id-Bodega` (bodega activa).

## Cómo correr en local

1. Levanta el backend (`polaria-wms-api`) en el puerto **3000** (o el que configures en `.env.local`).
2. Configura `.env.local` con la URL del API y, si aplica, la de Mateo.
3. Arranca el frontend:

```bash
npm install
npm run dev
```

4. Abre [http://localhost:3001/login](http://localhost:3001/login).

## Login con correo electrónico

El WMS identifica usuarios por **correo electrónico** (no por username). Las peticiones de prelogin y login envían el header `X-Auth-Client: wms` para que el API resuelva el flujo correcto.

El campo de login valida formato de correo antes de llamar al API.

## Flujo de prueba manual

### Configurador (scope platform)

1. Ir a `/login`.
2. Ingresar correo del configurador (ej. `configurador@polaria.tech`).
3. Clic en **Continuar** → escena de contraseña con preview del usuario.
4. Ingresar contraseña y **Iniciar sesión**.
5. Ver escena de éxito → redirección automática a `/configurador`.

### Usuario tenant (requiere empresa)

1. Ingresar correo del usuario (ej. `admin@acme.com`).
2. Clic en **Continuar**.
3. Si el API responde `422`, aparece el campo **Código de empresa** en la misma escena.
4. Ingresar código: `ACME` y **Continuar** de nuevo.
5. Ingresar contraseña → **Iniciar sesión**.
6. Redirección a `/dashboard`.

## SSO con Mateo IA

Integración bidireccional entre WMS y Mateo usando códigos de un solo uso (`POST /auth/mateo-exchange`).

### WMS → Mateo (salida)

Usuario autenticado en el WMS puede abrir Mateo sin volver a iniciar sesión:

1. Clic en **Mateo IA** en el topbar.
2. El frontend llama `POST /auth/mateo-handoff` con el Bearer token actual.
3. El API devuelve `{ code, expiresIn }`.
4. El WMS marca salida SSO, limpia sesión local (sin redirigir a `/login`) y navega a `{NEXT_PUBLIC_MATEO_URL}/auth/sso?code={code}`.
5. Mateo (repo `chatbot-mateo`) canjea el código con su propio flujo.

> **iOS Safari:** no usar `performLogout` + `router.replace` antes de la navegación externa; Safari puede quedarse en `/login`. Ver `lib/mateo-sso-exit.ts`.

Si falla el handoff, se muestra un mensaje de error debajo del topbar. El botón muestra loading mientras se genera el código.

### Mateo → WMS (entrada)

Usuario autenticado en Mateo puede abrir el WMS sin volver a iniciar sesión:

1. Clic en **Polaria WMS** en Mateo.
2. Mateo cierra sesión local y redirige a `{WMS_URL}/auth/sso?code={code}`.
3. La ruta `/auth/sso` (fuera del shell protegido) canjea el código con `POST /auth/mateo-exchange`.
4. Se guardan tokens en `localStorage` (`polaria-auth`), se hidrata sesión con `GET /auth/me` y se redirige según scope:
   - `platform` → `/configurador`
   - `tenant` → `/dashboard`

**Respaldo hash:** Mateo también puede enviar `#polaria-auth=<base64url>` con el payload zustand. `AuthSessionScript` lo importa de forma síncrona (antes del guard de rutas protegidas), escribe en `localStorage` y limpia el hash.

Estados de error en `/auth/sso`:

- Sin `?code=` → mensaje amigable + enlace a `/login`.
- Código inválido o expirado (401) → mensaje específico + enlace a `/login`.

## Arquitectura

```
components/auth/     → UI (LoginStepUser, LoginStepPassword, LoginStepSuccess, LoginFlow)
modules/auth/        → Servicio API (prelogin, login, me, logout, mateoHandoff, wmsSsoExchange)
services/api.ts      → Cliente HTTP + interceptor Bearer + errores tipados
stores/auth.store.ts → Estado de sesión (localStorage) + contexto tenant
lib/supabase/client  → Cliente Supabase RLS-ready sincronizado con JWT del API
providers/           → AuthProvider + CompanyProvider (contexto tenant / bodega activa)
components/auth/     → AuthGuard (protege /configurador y /dashboard)
components/layouts/  → AppShellLayout conecta Mateo IA al topbar
```

## Endpoints consumidos

| Método | Ruta | Uso |
|--------|------|-----|
| POST | `/auth/prelogin` | Validar correo y obtener preview (`X-Auth-Client: wms`) |
| POST | `/auth/login` | Autenticación con contraseña (`X-Auth-Client: wms`) |
| GET | `/auth/me` | Hidratar contexto de sesión |
| POST | `/auth/logout` | Cerrar sesión |
| POST | `/auth/mateo-handoff` | Generar código SSO para Mateo IA (Bearer) |
| POST | `/auth/mateo-exchange` | Canjear código SSO desde Mateo IA (público) |

## Errores manejados en UI

| HTTP | Mensaje |
|------|---------|
| 401 | Credenciales inválidas |
| 403 | No autorizado para esta empresa/cuenta |
| 404 | Usuario no encontrado o inactivo |
| 422 | Debes ingresar código de empresa |
| 5xx | Error del servidor |

## Tests

```bash
npm test
```

Incluye pruebas del mapeo de errores, del happy path del servicio de auth (con `fetch` mockeado), de `mateoHandoff`, de `wmsSsoExchange`, del flujo `/auth/sso`, del contexto tenant (`CompanyProvider`), guards (`AuthGuard`, `PlatformScopeGuard`, `TenantScopeGuard`), `getPostLoginRoute`, integración nav + `ModuleRoleGate`, y del shell POL-31. Ver [POL-31-SHELL.md](./POL-31-SHELL.md).
