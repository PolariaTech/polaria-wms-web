# src/components/

Componentes React reutilizables de la interfaz de usuario.

## Subcarpetas

| Carpeta | Subcarpetas | Contenido |
|---------|-------------|-----------|
| `auth/` | `guards`, `login`, `sso`, `session` | Guards, flujo de login, SSO, bootstrap de sesión |
| `layouts/` | `shell`, `auth` | App shell, topbar, layout de autenticación |
| `shared/` | `table`, `form`, `module`, `cards`, `utils` | Tablas, formularios, shells de módulo, tarjetas |
| `forms/` | — | Formularios compuestos (futuro) |
| `ui/` | — | Primitivos de UI (futuro) |

## Convención

- Importar con rutas explícitas: `@/components/auth/guards/RoleGate`, `@/components/shared/form/PolariaFormModal`.
- La lógica de negocio vive en `src/modules/`; aquí solo presentación e interacción.
