# Seguridad — Polaria WMS Web

## Principios

1. **RLS + API** son la barrera real; la UI solo oculta navegación.
2. **Nunca** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` — solo `SUPABASE_SERVICE_ROLE_KEY` en servidor.
3. Escrituras sensibles siempre vía API Nest (proxy `/api/*`).

## Guards UI

| Guard | Rutas |
|-------|-------|
| `AuthGuard` | Shell autenticado |
| `PlatformScopeGuard` | `/configurador` |
| `TenantScopeGuard` | `/dashboard` |
| `ModuleRoleGate` | Módulos (mapa, reportería, etc.) |
| `BodegaRequiredGuard` | Operaciones con bodega activa |

## Reportería

`/dashboard/reporteria` exige módulo `AUDIT` (nivel empresa) vía `ModuleRoleGate`.

## Rate limiting

- `POST /login/resolve-tenant`: 20 req/min por IP (`lib/security/rate-limit.ts`).

## Cabeceras HTTP

`next.config.ts` aplica `X-Frame-Options`, `nosniff`, `Referrer-Policy`, etc.

## RBAC alineado con API

`operario` tiene `inventory:write` y `warehouse_state:write` en `constants/wms/permissions.ts`.

## Ver también

- [AUTH.md](./AUTH.md)
- `polaria-wms-api/docs/THREAT-MODEL.md`
