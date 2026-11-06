### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Editar pedido |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| Campos nuevos o modificados | Denominación comercial editable + override (REQ-241); RFC (REQ-259); Día de la semana (REQ-257); Precio unitario en líneas — vacío/0 al confirmar (REQ-235); Folio de factura; Fecha de creación; Dirección de entrega (pre-llenado REQ-252); Notas generales del pedido (layout); Título y descripción del modal (layout); Acciones de iconos del footer (Cypher); Etiqueta TAREA / Órdenes de tarea (REQ-214/225) |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | Sí |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 02/11/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
|---|---|---|---|---|---|---|---|---|---|
| Folio de factura | Texto | No | — | — | No | — | — | Sin mensaje de error: el vacío y cualquier texto se guardan. | Front |
| Fecha de creación | Texto | No | — | — | No | — | — | Sin mensaje de error: no se edita ni se guarda desde este campo. | Front |
| Denominación comercial | Texto | No | — | Override WMS del comprador, o apodo sync | No | Razón social (comprador) | REQ-241: editable; si difiere del apodo sync se guarda en denominacion_comercial_override (OV + ficha); el sync no pisa el override | Sin mensaje de error: vacío se guarda (vuelve al apodo sync). | Front / Back / BD |
| RFC | Texto | No | — | RFC del comprador en catálogo | No | Razón social (comprador) | Al elegir comprador se muestra su RFC; solo lectura en el formulario | Sin mensaje de error: no se edita ni se guarda desde este campo. | Front |
| Día de la semana | Texto | No | — | Derivado de Fecha de entrega | No | Fecha de entrega | Se recalcula al cambiar la fecha de entrega; solo lectura | Sin mensaje de error: no se edita ni se guarda desde este campo. | Front |
| Precio unitario (línea) | Número | No | ≥ 0; vacío se trata como 0 | — | No | — | REQ-235: al confirmar y en avance, precio vacío o 0 se persiste como 0; no bloquea confirmación | Sin mensaje de bloqueo por precio vacío/0 al confirmar. | Front / Back |
| Dirección de entrega | Texto | No | — | Última OV confirmada del comprador, o dirección de ficha | No | Razón social (comprador) | Al elegir razón social se prellena; si el usuario ya escribió y onlyEmpty, no se pisa | Sin mensaje de bloqueo al confirmar: vacío se guarda; puede marcarse en missingFields si el origen no la trajo. | Front |
| Notas generales del pedido | Texto | No | — | — | No | — | — | Sin mensaje de error: vacío se guarda. | Front |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
|---|---|---|---|
| Folio de factura | — | No | — |
| Fecha de creación | — | Sí (solo lectura) | — |
| Denominación comercial | En Datos del pedido, después de código de cliente (REQ-241) | No | — |
| RFC | En Datos del pedido, después de denominación comercial (REQ-259) | Sí (solo lectura) | — |
| Día de la semana | En Programación / Entrega, junto a Fecha de entrega (REQ-257) | Sí (solo lectura) | — |
| Precio unitario (línea) | Dentro de la grilla de líneas del pedido | No | — |
| Notas generales del pedido | Primer campo del bloque Entrega, después de Datos del pedido (REQ-216/254) | No | — |
| Dirección de entrega | Dentro del bloque Entrega, después de la ventana de entrega y antes de contacto, teléfono y correo (REQ-217) | No | — |

### Tabla 3 — Pre-llenado

| Campo | ¿Tiene pre-llenado? | Origen del pre-llenado (única respuesta) | Editable manualmente por el usuario |
|---|---|---|---|
| Folio de factura | Sí | Información de BD | Sí |
| Fecha de creación | Sí | Información de BD | No |
| Denominación comercial | Sí | Información de BD (override ?? apodo sync) | Sí |
| RFC | Sí | Información de BD | No |
| Día de la semana | Sí | Derivado de Fecha de entrega (Front) | No |
| Precio unitario (línea) | Sí | Extracción IA / Información de BD | Sí |
| Dirección de entrega | Sí | Información de BD | Sí |
| Notas generales del pedido | Sí | Extracción IA / Información de BD | Sí |

### Tabla 4 — Prueba automatizada (Nivel 2)

**Tabla 4.1 — Acceso y botones**

| Campo | Valor |
|---|---|
| Rol con que se inicia sesión | Operador de cuenta |
| Ruta | /dashboard/ventas/ordenes |
| Pasos para abrir el formulario | clic button "Editar" en la orden → esperar dialog "Editar pedido" |
| Registro que debe existir | Una orden de venta de la cuenta, con al menos una orden de trabajo |
| Archivos del formulario | src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx; src/modules/sales/ordenes/surtido/folio-factura-captura.ts; src/modules/sales/ordenes/surtido/guardar-folio-factura-captura.client.ts |
| Botón Guardar | button "Actualizar" |
| Botón Cancelar / Cerrar | button "Cancelar" |
| Diálogo de descarte: botón que confirma descartar | button "Salir" |
| Diálogo de descarte: botón para seguir editando | button "Seguir editando" |
| Botón de la advertencia no-saltable | — |

**Tabla 4.2 — Campos**

| Campo | Localizador | Valor de prueba |
|---|---|---|
| Folio de factura | textbox "Folio de factura" | FAC-1001 |
| Fecha de creación | textbox "Fecha de creación" | La fecha con la que se creó el pedido |
| Denominación comercial | textbox "Denominación comercial" | Luis (override WMS; vacío vuelve al apodo sync) |
| RFC | textbox "RFC" | RFC del comprador (solo lectura) |
| Día de la semana | textbox "Día de la semana" | Día derivado de la fecha de entrega (solo lectura) |
| Precio unitario (línea) | spinbutton / textbox de precio en línea | vacío o 0 al confirmar |
| Dirección de entrega | textbox / textarea de dirección de entrega | Av. Prueba 100 |
| Notas generales del pedido | textbox / textarea de notas generales | Entregar en andén 2 |

### Notas y justificaciones

Esta versión del schema documenta Denominación comercial editable con override (REQ-241), Folio de factura, Fecha de creación, RFC (REQ-259), Día de la semana (REQ-257), precio vacío/0 al confirmar (REQ-235) y los cambios de layout/prefill del lote En Revisión OV (REQ-215/216/217/220/224/232/252/254). Denominación: si el valor difiere del apodo sync se persiste en `denominacion_comercial_override` (OV + ficha comprador); el sync no pisa el override. Contrato Front↔Back cubierto por `map-denominacion-detalle.test.ts` y `orden-venta-capture-fields.test.ts`. Las reglas de validación de Dirección y Notas no cambian respecto al formulario ya existente; solo se reubicaron en el layout y Dirección gana prefill desde la última OV confirmada del comprador (REQ-252). Confirmar no exige dirección no vacía (no hay `setError` ni return en `handleSubmit` por ese campo); la obligatoriedad visual vía `missingFields` es orientativa desde el origen IA.

Orden de los campos (REQ-216/254/257/259): Datos del pedido lleva cliente, código, denominación comercial, RFC (solo lectura), fecha de creación y folio (solo al editar), orden de compra y centro de consumo. Entrega / Programación lleva, en este orden, notas generales, prioridad, moneda, fecha de entrega, día de la semana (derivado, solo lectura), ventana desde y hasta, dirección de entrega (a ancho completo) y debajo contacto, teléfono y correo. Las notas dejaron de ir antes de Entrega: la versión 1.2 del schema las ubicaba ahí y no coincidía con el código del lote En Revisión OV (REQ-254 las bajó a Entrega).

Fecha de creación solo aparece al editar un pedido. El input es de solo lectura: muestra formatDateTime de created_at, y si no hay, de fecha_pedido. No se envía al guardar.

RFC (REQ-259) es solo lectura: se toma de `comprador.rfc` / `comprador_rfc` al cargar el detalle o al elegir comprador. No se edita ni se envía como campo propio del payload de captura.

Día de la semana (REQ-257) es solo lectura: `diaSemanaEntregaEsTitulo(fechaEntrega)`. Vacío si no hay fecha de entrega. No se persiste como columna aparte.

Precio unitario (REQ-235): `persist-linea-avance` y `createOrdenVenta`/`updateOrdenVenta` aceptan precio vacío o 0 en avance y al confirmar; se normaliza a 0. La cantidad > 0 sigue exigida solo al confirmar (REQ-138).

El campo Folio es opcional: el input muestra el placeholder "Opcional" y el hint "Opcional. Se muestra en el detalle de la orden de trabajo." Vacío se guarda. No hay máximo de longitud en el input. Al guardar se recorta el texto con trim.

No hay capa Back ni BD nueva para el texto del folio. El valor vive en orden_venta_surtido_captura.payload, clave facturaOkFolio.

El modal no se cierra al tocar el fondo (closeOnBackdrop es false). Si hay progreso sin guardar, Cancelar abre el diálogo "¿Salir del pedido?" con "Salir" y "Seguir editando".

En edición de un pedido que ya no está por confirmar, el botón de guardar dice "Actualizar". Si todavía está por confirmar, dice "Confirmar". Título y descripción del modal se resuelven con `tituloCreateModalOv` / `descriptionCreateModalOv`: en edición no hay subtítulo (REQ-220), el título identifica el pedido. Eliminar tarea y Guardar avance van como iconos en el pie, junto a Cancelar (REQ-232); el encabezado conserva solo el botón de Cypher. Etiquetas de OT usan "TAREA" / "Órdenes de tarea" (REQ-214/225).

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.5 |
| Fecha de aprobación | 06/11/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
