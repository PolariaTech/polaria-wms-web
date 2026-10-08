# Changelog — polaria-wms-web

Versión de producto alineada con Polaria WMS.

## 2.9.17 — 2026-10-08

- Órdenes de venta: al guardar una línea se persiste `match_producto` (texto del cliente, sugerencia de Mateo y producto elegido por el usuario).
- Detalle OV: el panel Log muestra solo el último evento; al hacer click se abre el historial completo. Se ocultan del Log los eventos de “enviado a bodega / emitido”.
- PDF hoja de almacén: etiqueta **Orden de venta**; arriba OV + orden de trabajo, abajo `# de orden del cliente`. Meta **Creada** (`created_at` de la OV) e **Impresa** (momento de generar/imprimir), ambas en `dd/mm/aaaa HH:mm`.
- Captura OV: aviso de cliente habla de **clientes** (no «compradores»). Si Mateo no encuentra match exacto, siempre sugiere el cliente más cercano para aceptar o cambiar; si coincide exacto, no sugiere. Al aceptar la sugerencia solo se enlaza el cliente (no pisa entrega, productos ni precios del pedido).
- Captura OV / notas generales: Mateo prioriza bloques **Observaciones del cliente** (y homólogos: notas/comentarios/indicaciones) para notas de almacén.
- Captura OV / productos: si Mateo o el SKU encuentran el producto, se asigna sin pedir confirmación (variantes de familia no cuentan). Solo se sugiere lo más cercano cuando no hay match; typo real (jass/hass) sigue pidiendo confirmación. Mismo nombre con gramos distintos (260 vs 250) o mismo código en el PDF → se elige solo.

## 2.9.15 — 2026-10-07

- Órdenes de venta: solo **4 estados** de negocio (`por_confirmar`, `confirmada`, `alistamiento`, `alistada` → etiqueta **Alistado**). Valores legados se normalizan al mostrar.
- Hub operador: badge de notificación en **Ventas** con el total de OV en por confirmar; la tarjeta se resalta cuando hay pendientes.

## 2.9.14 — 2026-10-07

- Captura OV (opción mensaje/archivos): matching de catálogo más estricto y consciente de ambigüedad (variantes/tallas, typos jass/hass). Si hay rivales cercanos pide confirmación con UI breve (sin banners largos ni aviso de stock). En discrepancias, «Usar ficha» solo si Mateo no trajo el dato; si ya lo llenó, solo aviso. Fecha atrasada: «Usar hoy». Claves de Mateo se validan contra el catálogo real.

## 2.9.13 — 2026-10-06

- Captura OV con Mateo (mensaje/archivos): líneas sin catálogo ya no se descartan; se muestran con sugerencia cercana, opción de aceptar, elegir otro producto, cambiar o borrar.
- Campo **Notas generales** (antes mal etiquetado “Cuerpo del mensaje”): ahora sí toma `observaciones` / `notasGeneralesAlmacen` de la IA o claves del origen.
- Entrega (dirección, andén, contacto, teléfono, ventana): sale del correo, mensaje o PDF; la ficha del comprador solo cubre lo que Mateo no encontró.

## 2.9.12 — 2026-10-06

- Captura de OV: fecha atrasada con aviso, bodega de origen, pickers, cuerpo del mensaje, textos de cliente.
- Estados **Alistamiento** / **Alistada** tras fotos QR.
- Hoja de almacén: OT `1-2/9` si hay más de 49 productos, notas del correo, incidencias.
- Listado de OV por fecha de creación (más reciente primero).
- Sesión WMS: TTL **7 días** (antes 23); renueva el access JWT (Supabase refresh + retry 401) sin reiniciar ese tope.

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
- Sesión WMS/Mateo Support: TTL **7 días** (el handoff SSO sigue en 60 s; tope bajo el límite de `setTimeout` del browser).

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
