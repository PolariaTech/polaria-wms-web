# POL-31 — Shell multi-rol WMS Web

Documentación de cierre del ticket **POL-31**: shell autenticado con dominios platform/tenant, permisos, navegación, dashboard dinámico, clientes Supabase por dominio, Realtime y vistas operativas base.

## Mapa de rutas

### Dominio platform (`scope: platform`)

| Ruta | Página | Guard |
|------|--------|-------|
| `/configurador` | Panel configurador | `PlatformScopeGuard` |
| `/configurador/creacion` | Creación (stub) | `PlatformScopeGuard` |
| `/configurador/asignacion` | Asignación (stub) | `PlatformScopeGuard` |
| `/configurador/integracion` | Integración (stub) | `PlatformScopeGuard` |
| `/platform` | Alias legacy → redirige a `/configurador` | — |

Post-login platform: **`/configurador`** (`getPostLoginRoute("platform")`).

### Dominio tenant (`scope: tenant`)

| Ruta | Módulo | Guard layout | Gate vista |
|------|--------|--------------|------------|
| `/dashboard` | Inicio / widgets por rol | `TenantScopeGuard` + `BodegaRequiredGuard` | — |
| `/dashboard/ingreso` | Compras (SOL / OC / recepciones) | ↑ | `minNivelRol: bodega` |
| `/dashboard/mapa` | Inventario Realtime | ↑ | `inventory:read` |
| `/dashboard/procesamiento` | Procesamiento + tareas | ↑ | `PROCESSING` + roles |
| `/dashboard/ventas` | Órdenes de venta | ↑ | `SALES` |
| `/dashboard/transporte` | Guías + evidencias | ↑ | `TRANSPORT` + roles |
| `/dashboard/reporteria` | Auditoría operativa | ↑ | `AUDIT` |

Post-login tenant: **`/dashboard`**.

### Públicas

| Ruta | Uso |
|------|-----|
| `/login` | Flujo correo + contraseña |
| `/auth/sso` | Canje SSO Mateo → WMS |

Todo el shell autenticado (`/configurador/*`, `/dashboard/*`) está envuelto por **`AuthGuard`** en `AppShellLayout`.

## Matriz rol → módulos visibles (tenant)

Criterios alineados a `src/config/navigation.ts` y `ModuleRoleGate` en vistas operativas.

| Rol | Inicio | Ingreso | Mapa | Procesamiento | Ventas | Transporte | Reportería |
|-----|:------:|:-------:|:----:|:-------------:|:------:|:----------:|:------------:|
| operario | ✓ | ✓ | ✓ | — | — | — | — |
| custodio | ✓ | ✓ | ✓ | — | — | — | — |
| jefe_bodega | ✓ | ✓ | ✓ | ✓ | — | ✓ | — |
| administrador_bodega | ✓ | ✓ | ✓ | ✓ | — | ✓ | — |
| procesador | ✓ | ✓ | — | ✓ | — | — | — |
| transportista | ✓ | ✓ | — | — | — | ✓ | — |
| operador_cuenta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| administrador_cuenta (cuenta) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| administrador_cuenta (empresa) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| configurador | — | — | — | — | — | — | — |

**Notas:**

- **Mapa** exige permiso `inventory:read` (operario, custodio, roles cuenta/bodega con lectura).
- **Reportería** exige módulo `AUDIT` → nivel jerárquico mínimo `empresa`.
- **Procesamiento** y **Transporte** combinan módulo + lista de roles permitidos.
- El **configurador** opera solo en dominio platform (`/configurador`).

## Realtime `warehouse_state`

Hook: `src/hooks/useWarehouseStateRealtime.ts`

1. **Snapshot inicial:** `listWarehouseState()` filtrado por `id_bodega` y `codigo_cuenta` del tenant activo.
2. **Canal Supabase:** `warehouse_state:{idBodega}` con eventos `INSERT`, `UPDATE`, `DELETE` y filtro `id_bodega=eq.{idBodega}`.
3. **Estado expuesto:** `rows`, `isConnected`, `isLoading`, `error`, `lastEventAt`.
4. **Re-suscripción:** al cambiar bodega activa (`CompanyProvider`) o JWT (`accessToken` → `syncSupabaseAuthSession`).
5. **Cleanup:** `removeChannel` al desmontar o cambiar dependencias.
6. **Vista:** `/dashboard/mapa` muestra tabla + badge **En vivo** cuando `isConnected`.

## Clientes de datos por dominio (Fase 5)

| Módulo | Servicio | Lectura |
|--------|----------|---------|
| `inventory` | `listWarehouseState` | Supabase `warehouse_state` |
| `purchases` | `listSolicitudesCompra`, `listOrdenesCompra`, `listRecepciones` | Supabase |
| `sales` | `listOrdenesVenta` | Supabase |
| `processing` | `listSolicitudesProcesamiento`, `listTareasCola` | Supabase |
| `transport` | `listGuiasEnvio`, `listEvidenciasTransporte` | Supabase |
| `audit` | `listAuditoriaOperacion` (límite 25) | Supabase |

Errores: `DomainServiceError`. Escrituras vía API Nest: **POL-5+** (comentarios `TODO POL-5+` en servicios).

## Variables de entorno requeridas

| Variable | Obligatoria | Uso |
|----------|-------------|-----|
| `NEXT_PUBLIC_API_BASE_URL` | Sí (auth) | Login, `/auth/me`, logout, SSO Mateo, widget-token |
| `NEXT_PUBLIC_MATEO_URL` | SSO Mateo | Handoff bidireccional (topbar) |
| `NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL` | Widget flotante | Bundle IIFE; ver [MATEO-WIDGET.md](./MATEO-WIDGET.md) |
| `NEXT_PUBLIC_SUPABASE_URL` | Lecturas / Realtime | Cliente browser + canales Realtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lecturas / Realtime | JWT sincronizado con sesión WMS |

Sin Supabase configurado: auth por API sigue funcionando; listados operativos y Realtime muestran error controlado.

Ver también [AUTH.md](./AUTH.md).

## Comandos de verificación

```bash
npm test
npm run build
npm run lint
```

## Criterios de aceptación POL-31

- [x] Roles y permisos (`constants/roles`, `constants/permissions`, `usePermissions`, `RoleGate`)
- [x] Normalización `nivelRol` y sesión (`normalize-nivel-rol`, `auth.service`)
- [x] Rutas platform `/configurador/*` con `PlatformScopeGuard`
- [x] Rutas tenant `/dashboard/*` con `TenantScopeGuard` + `BodegaRequiredGuard`
- [x] Configurador: panel + sub-rutas stub por tarjetas
- [x] Dashboard multi-rol con widgets por `idRol`
- [x] Servicios Supabase tipados por dominio (`src/modules/*/services`)
- [x] Realtime `warehouse_state` en mapa
- [x] Vistas operativas base (lista + loading/error/vacío + `ModuleListPage`)
- [x] Tests unitarios e integración (guards, login, nav + gate, servicios, páginas)
- [x] Documentación AUTH + este archivo

**Fuera de alcance POL-31 (POL-5+):** formularios CRUD, endpoints Nest de escritura, sidebar (removido por diseño actual — navegación por dashboard/tarjetas).
