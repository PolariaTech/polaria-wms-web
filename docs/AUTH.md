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

En desarrollo, el frontend proxea las peticiones del navegador vía `/api/*` → backend, evitando errores de CORS cuando front y back corren en puertos distintos (ej. front `:3001`, back `:3000`).

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
5. Ver escena de éxito → redirección automática a `/platform`.

### Usuario tenant (requiere empresa)

1. Ingresar correo del usuario (ej. `admin@acme.com`).
2. Clic en **Continuar**.
3. Si el API responde `422`, aparece el campo **Código de empresa** en la misma escena.
4. Ingresar código: `ACME` y **Continuar** de nuevo.
5. Ingresar contraseña → **Iniciar sesión**.
6. Redirección a `/dashboard`.

## SSO con Mateo IA

Usuario autenticado en el WMS puede abrir Mateo sin volver a iniciar sesión:

1. Clic en **Mateo IA** en el topbar.
2. El frontend llama `POST /auth/mateo-handoff` con el Bearer token actual.
3. El API devuelve `{ code, expiresIn }`.
4. Redirección a `{NEXT_PUBLIC_MATEO_URL}/auth/sso?code={code}`.
5. Mateo (repo `chatbot-mateo`) canjea el código; el WMS no implementa `/auth/sso`.

Si falla el handoff, se muestra un mensaje de error debajo del topbar. El botón muestra loading mientras se genera el código.

## Arquitectura

```
components/auth/     → UI (LoginStepUser, LoginStepPassword, LoginStepSuccess, LoginFlow)
modules/auth/        → Servicio API (prelogin, login, me, logout, mateoHandoff)
services/api.ts      → Cliente HTTP + interceptor Bearer + errores tipados
stores/auth.store.ts → Estado de sesión (sessionStorage)
providers/           → AuthProvider (hidrata sesión al cargar)
components/auth/     → AuthGuard (protege /platform y /dashboard)
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

Incluye pruebas del mapeo de errores, del happy path del servicio de auth (con `fetch` mockeado) y de `mateoHandoff`.
