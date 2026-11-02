### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Editar pedido |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| Campos nuevos o modificados | Folio de factura; Fecha de creación |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | Sí |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 02/11/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
|---|---|---|---|---|---|---|---|---|---|
| Folio de factura | Texto | No | — | — | No | — | — | Sin mensaje de error: el vacío y cualquier texto se guardan. | Front |
| Fecha de creación | Texto | No | — | — | No | — | — | Sin mensaje de error: no se edita ni se guarda desde este campo. | Front |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
|---|---|---|---|
| Folio de factura | — | No | — |
| Fecha de creación | — | No | — |

### Tabla 3 — Pre-llenado

| Campo | ¿Tiene pre-llenado? | Origen del pre-llenado (única respuesta) | Editable manualmente por el usuario |
|---|---|---|---|
| Folio de factura | Sí | Información de BD | Sí |
| Fecha de creación | Sí | Información de BD | No |

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

### Notas y justificaciones

Esta versión del schema documenta Folio de factura y Fecha de creación. El resto de Editar pedido ya existía y no cambia en este requerimiento.

Fecha de creación solo aparece al editar un pedido. El input es de solo lectura: muestra formatDateTime de created_at, y si no hay, de fecha_pedido. No se envía al guardar.

El campo es opcional: el input muestra el placeholder "Opcional" y el hint "Opcional. Se muestra en el detalle de la orden de trabajo." Vacío se guarda. No hay máximo de longitud en el input. Al guardar se recorta el texto con trim.

No hay capa Back ni BD para el texto del folio. No se agregó columna ni restricción. El valor vive en orden_venta_surtido_captura.payload, clave facturaOkFolio. Al escribir se borran los alias facturaAsociada, "Folio factura asociada", "Factura (OK) folio", "Documentación folio" y "Folio". El pre-llenado lee la primera de esas claves que tenga texto. Cada orden de trabajo guarda el suyo.

El modal no se cierra al tocar el fondo (closeOnBackdrop es false). Si hay progreso sin guardar, Cancelar abre el diálogo "¿Salir del pedido?" con "Salir" y "Seguir editando". El folio no tiene advertencia de dos fuentes: solo viene de la captura, y el usuario puede cambiarlo. Por eso el botón de advertencia no-saltable no aplica.

En edición de un pedido que ya no está por confirmar, el botón de guardar dice "Actualizar". Si todavía está por confirmar, dice "Confirmar".

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.1 |
| Fecha de aprobación | 02/11/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
