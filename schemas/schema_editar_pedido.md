### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Editar pedido |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| Campos nuevos o modificados | Folio de factura; Fecha de creación; Dirección de entrega (pre-llenado REQ-252); Notas generales del pedido (layout); Título y descripción del modal (layout); Acciones de iconos del footer (Cypher) |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | Sí |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 02/11/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
|---|---|---|---|---|---|---|---|---|---|
| Folio de factura | Texto | No | — | — | No | — | — | Sin mensaje de error: el vacío y cualquier texto se guardan. | Front |
| Fecha de creación | Texto | No | — | — | No | — | — | Sin mensaje de error: no se edita ni se guarda desde este campo. | Front |
| Dirección de entrega | Texto | No | — | Última OV confirmada del comprador, o dirección de ficha | No | Razón social (comprador) | Al elegir razón social se prellena; si el usuario ya escribió y onlyEmpty, no se pisa | Sin mensaje de bloqueo al confirmar: vacío se guarda; puede marcarse en missingFields si el origen no la trajo. | Front |
| Notas generales del pedido | Texto | No | — | — | No | — | — | Sin mensaje de error: vacío se guarda. | Front |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
|---|---|---|---|
| Folio de factura | — | No | — |
| Fecha de creación | — | No | — |
| Notas generales del pedido | Tras datos del pedido, antes del bloque Entrega | No | — |
| Dirección de entrega | Dentro del bloque Entrega | No | — |

### Tabla 3 — Pre-llenado

| Campo | ¿Tiene pre-llenado? | Origen del pre-llenado (única respuesta) | Editable manualmente por el usuario |
|---|---|---|---|
| Folio de factura | Sí | Información de BD | Sí |
| Fecha de creación | Sí | Información de BD | No |
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
| Dirección de entrega | textbox / textarea de dirección de entrega | Av. Prueba 100 |
| Notas generales del pedido | textbox / textarea de notas generales | Entregar en andén 2 |

### Notas y justificaciones

Esta versión del schema documenta Folio de factura, Fecha de creación y los cambios de layout/prefill del lote En Revisión OV (REQ-215/216/217/220/224/232/252/254). Las reglas de validación de Dirección y Notas no cambian respecto al formulario ya existente; solo se reubicaron en el layout y Dirección gana prefill desde la última OV confirmada del comprador (REQ-252). Confirmar no exige dirección no vacía (no hay `setError` ni return en `handleSubmit` por ese campo); la obligatoriedad visual vía `missingFields` es orientativa desde el origen IA.

Fecha de creación solo aparece al editar un pedido. El input es de solo lectura: muestra formatDateTime de created_at, y si no hay, de fecha_pedido. No se envía al guardar.

El campo Folio es opcional: el input muestra el placeholder "Opcional" y el hint "Opcional. Se muestra en el detalle de la orden de trabajo." Vacío se guarda. No hay máximo de longitud en el input. Al guardar se recorta el texto con trim.

No hay capa Back ni BD nueva para el texto del folio. El valor vive en orden_venta_surtido_captura.payload, clave facturaOkFolio.

El modal no se cierra al tocar el fondo (closeOnBackdrop es false). Si hay progreso sin guardar, Cancelar abre el diálogo "¿Salir del pedido?" con "Salir" y "Seguir editando".

En edición de un pedido que ya no está por confirmar, el botón de guardar dice "Actualizar". Si todavía está por confirmar, dice "Confirmar". Título y descripción del modal se resuelven con `tituloCreateModalOv` / `descriptionCreateModalOv` (sin instrucción sobrante en cabecera).

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.2 |
| Fecha de aprobación | 04/11/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
