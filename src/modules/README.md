# src/modules/

Módulos de dominio del WMS. Cada carpeta representa un área funcional del negocio.

## Propósito

Organiza el código por dominio siguiendo una arquitectura modular. Cada módulo es autocontenido con su propia lógica, componentes, hooks y tipos.

## Estructura interna de un módulo

```
modules/<nombre>/
├── components/     # Componentes específicos del módulo
├── hooks/          # Hooks específicos del módulo
├── services/       # Lógica de acceso a datos del módulo
├── types/          # Tipos TypeScript del dominio
├── utils/          # Utilidades del módulo
└── index.ts        # API pública del módulo (barrel export)
```

## Módulos disponibles

| Módulo           | Área de negocio                                              | Estado        |
|------------------|--------------------------------------------------------------|---------------|
| `auth/`          | Autenticación y sesiones (services; UI en `components/auth`) | Implementado  |
| `configurator/`  | Configurador de plataforma (scope `platform`)                | Implementado  |
| `admin-panel/`   | Administración de cuenta (scope `tenant`, rol admin)         | Implementado  |
| `dashboard/`     | Home y widgets del dashboard                                 | Implementado  |
| `inventory/`     | Stock, posiciones y mapa en tiempo real                      | Implementado  |
| `purchases/`     | Órdenes de compra, solicitudes y recepciones                 | Implementado  |
| `sales/`         | Órdenes de venta                                             | Implementado  |
| `processing/`    | Procesamiento y tareas en cola                               | Implementado  |
| `transport/`     | Guías de envío y evidencias                                  | Implementado  |
| `audit/`         | Registro de auditoría                                        | Service only  |
| `users/`         | Gestión de usuarios y perfiles                               | Stub (futuro) |
| `companies/`     | Empresas y organizaciones                                    | Stub (futuro) |
| `warehouses/`    | Configuración de almacenes                                   | Stub (futuro) |
| `accounts/`      | Cuentas contables                                            | Stub (futuro) |

## Scopes de la aplicación

| Scope    | Ruta base              | Módulo principal |
|----------|------------------------|------------------|
| Platform | `/configurador`        | `configurator`   |
| Tenant   | `/dashboard`           | `dashboard` + operativos |
| Admin    | `/dashboard/administracion` | `admin-panel` |

## Convención

- Los módulos no importan entre sí directamente; usa `components/shared`, `constants` o `lib`.
- La UI genérica va en `src/components/`; la específica del dominio va aquí.
- Las páginas en `app/` solo conectan rutas con componentes del módulo (sin lógica de negocio).
- Cada módulo expone solo lo necesario mediante `index.ts`.
