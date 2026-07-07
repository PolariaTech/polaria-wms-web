# src/lib/

Utilidades y lógica compartida sin UI.

## Subcarpetas

| Carpeta | Contenido |
|---------|-----------|
| `auth/` | Sesión, sync, storage, rutas protegidas, SSO |
| `utils/` | `cn`, errores de dominio, decimales, headers de tenant, etc. |
| `supabase/` | Cliente y helpers de consultas |
| `pedido-proveedor/` | Schemas del pedido a proveedor |
| `solicitud-compra-n8n/` | Schemas n8n de solicitudes de compra |

## Convención

- `@/lib/auth/auth-sync`, `@/lib/utils/cn`, `@/lib/supabase/domain-query`
- No duplicar archivos en la raíz de `lib/`; usar subcarpetas.
