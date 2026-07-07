# src/modules/

Módulos de dominio del WMS. Cada carpeta representa un área funcional del negocio.

## Estructura interna de un módulo

Los módulos grandes se organizan por **subdominio**:

```
modules/<nombre>/
├── <dominio>/          # ej. catalogo, solicitudes, home
│   ├── components/
│   ├── services/
│   ├── constants/
│   ├── types/
│   └── utils/
├── shared/             # piezas compartidas del módulo
└── index.ts            # API pública (barrel export)
```

Módulos pequeños pueden usar la misma convención con un solo dominio + `shared/`.

## Módulos reorganizados por dominio

| Módulo | Subdominios |
|--------|-------------|
| `admin-panel/` | `catalogo`, `proveedores`, `clientes`, `compradores`, `camiones`, `plantas`, `usuarios`, `bodega-interna`, `bodega-externa`, `inventario-mercancia`, `shared` |
| `configurator/` | `empresas`, `cuentas`, `bodega-interna`, `bodega-externa`, `usuarios`, `integracion`, `shared` |
| `warehouses/` | `estado-bodega`, `bodega-reportes`, `shared` |
| `administrador-bodega/` | vistas del administrador de bodega |
| `jefe-bodega/` | vistas y modales del jefe de bodega |
| `purchases/` | `solicitudes`, `ordenes`, `ingreso`, `compras`, `shared` |
| `dashboard/` | `home`, `operador-cuenta`, `shell`, `shared` |
| `inventory/` | `mapa`, `shared` |
| `sales/` | `ordenes`, `operador`, `shared` |
| `processing/` | `solicitudes`, `operador`, `shared` |
| `account-integration/` | `integracion`, `operador`, `shared` |
| `transport/` | `guias`, `shared` |

## `src/components/` también por subcarpetas

| Carpeta | Subcarpetas |
|---------|-------------|
| `auth/` | `guards`, `login`, `sso`, `session` |
| `layouts/` | `shell`, `auth` |
| `shared/` | `table`, `form`, `module`, `cards`, `utils` |

## Convención

- Importar desde el barrel del módulo cuando sea posible: `@/modules/purchases`.
- Dentro de un dominio, lo compartido del módulo va en `shared/`.
- La UI genérica va en `src/components/`; la específica del dominio en el módulo.
