# Changelog — polaria-wms-web

Versión de producto alineada con Polaria WMS.

## 2.8.20 — 2026-10-01

- Órdenes de venta: OT por pedido+almacén, pager, preview, precios del documento, body correo en notas.
- Captura QR / surtido por OT; tema claro-oscuro en perfil; loaders Mateo.
- Leer pedido con IA sigue en BFF Next (`OPENAI_*` en web). Match estricto de productos/comprador; ficha del comprador no se pisa con basura del PDF.

## 2.8.12 — 2026-09-30

- Órdenes de venta desde mensaje/archivos: órdenes de trabajo por **pedido + almacén**, preview y formulario paginados, precios del documento.
- Buscador del catálogo admin: filtro en cliente al escribir.

## 2.7.15 — 2026-09-25

- Admin de cuenta: **Cargar reportes** (URL) y edición de nombre/URL/estado.
- **Permisos de reportes** por usuario (lupa + tabla) sobre los reportes de la cuenta.
- Maestro **Clientes** renombrado a **Grupos**.
- Compradores: **grupo perteneciente** (catálogo por cuenta), filtros de exportación por grupo/producto/fechas.
- Gestión de precios: plantilla Excel editable (gris → verde), import con preview, **imprimir** lista (no editable, landscape, precio nuevo = importado o 50).
- Impresión/export por grupos y/o compradores (lupa multi-select).
- Sesión WMS/Mateo Support: TTL **23 días** (el handoff SSO sigue en 60 s; tope bajo el límite de `setTimeout` del browser).

## 2.7.5 — 2026-09-17

- Acceso a Polaria WMS y Mateo IA por **usuario** (no por cuenta).
- Configurador → Cuentas: maestros reales de cada cuenta y carga unificada (card QR/SSO).
- La cuenta solo controla si puede iniciar sesión (`esta_activa`).
- Gestión de precios de compradores: plantilla Excel .xlsx en gris, protegida sin contraseña (solo Equivalencia y Precio nuevo).

## 2.4.9 — 2026-09-03

- Alta de comprador por pasos (wizard) y columnas planas en ficha.
- Pedido de venta: autollenado desde ficha del comprador.
- Emisión de OV robusta ante reintento si ya quedó confirmada.
- Captura de OV en columnas + límites/filtros de listados 2026.

## 2.4.3 — 2026-08-29

- Sesión de 12 h y cierre conjunto de Mateo.
- Editar en Creación; alias de producto por comprador.
- Teléfonos con prefijo internacional; enlaces/PDF de Mateo.
