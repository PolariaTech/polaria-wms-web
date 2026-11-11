### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Editar pedido |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| Campos nuevos o modificados | Layout Entrega REQ-278 (moneda en Datos del pedido; prioridad oculta; orden fecha/día/horas → contacto → dirección → notas; etiquetas Hora desde/hasta); aviso total solicitud REQ-279 (`totalSolicitudDetectado`, capa Front); Denominación comercial editable + override (REQ-241); RFC (REQ-259); Día de la semana (REQ-257); Precio unitario en líneas — vacío/0 al confirmar (REQ-235); Folio de factura; Fecha de creación; Dirección de entrega (pre-llenado REQ-252); pin de mapa `entrega_lat`/`entrega_lng` opcional (REQ-251); Notas generales del pedido (layout + sanitize REQ-286/277); Título y descripción del modal (layout); Acciones de iconos del footer (Cypher); Etiqueta TAREA / Órdenes de tarea (REQ-214/225); modo solo lectura cuando otro usuario tiene el bloqueo de edición (REQ-180); cabecera y entrega selladas por el usuario al guardar (REQ-281); etiqueta «Madurez: …» en la especificación de línea sin duplicarla (REQ-287) |
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
| Moneda | Texto | No | — | MXN | No | — | REQ-278: vive en «Datos del pedido» (ya no en Entrega) | Sin mensaje de error: vacío se trata como MXN al guardar. | Front |
| Día de la semana | Texto | No | — | Derivado de Fecha de entrega | No | Fecha de entrega | Se recalcula al cambiar la fecha de entrega; solo lectura | Sin mensaje de error: no se edita ni se guarda desde este campo. | Front |
| Hora desde | Texto (hora) | No | — | — | No | — | REQ-278: etiqueta «Hora desde» (antes ventana desde) | Sin mensaje de bloqueo al confirmar. | Front |
| Hora hasta | Texto (hora) | No | — | — | No | — | REQ-278: etiqueta «Hora hasta» (antes ventana hasta) | Sin mensaje de bloqueo al confirmar. | Front |
| Precio unitario (línea) | Número | No | ≥ 0; vacío se trata como 0 | — | No | — | REQ-235: al confirmar y en avance, precio vacío o 0 se persiste como 0; no bloquea confirmación | Sin mensaje de bloqueo por precio vacío/0 al confirmar. | Front / Back |
| Dirección de entrega | Texto | No | — | Última OV confirmada del comprador, o dirección de ficha | No | Razón social (comprador) | Al elegir razón social se prellena; si el usuario ya escribió y onlyEmpty, no se pisa | Sin mensaje de bloqueo al confirmar: vacío se guarda; puede marcarse en missingFields si el origen no la trajo. | Front |
| Latitud de entrega (`entrega_lat`) | Número | No | Finito | null | No | Dirección de entrega / mapa | REQ-251: pin opcional vía mapa (Leaflet + Nominatim); no bloquea confirmar; se guarda con la OV | Sin mensaje de bloqueo: vacío/null se guarda. | Front / BD |
| Longitud de entrega (`entrega_lng`) | Número | No | Finito | null | No | Dirección de entrega / mapa | REQ-251: pin opcional vía mapa (Leaflet + Nominatim); no bloquea confirmar; se guarda con la OV | Sin mensaje de bloqueo: vacío/null se guarda. | Front / BD |
| Notas generales del pedido | Texto | No | — | — | No | — | REQ-286/277: no inventar Entrega/Destino ni duplicar campos parametrizados | Sin mensaje de error: vacío se guarda. | Front |
| Aviso total solicitud vs OV | Número (solo lectura / banner) | No | > 0 para mostrar | Extracción IA o resolve-occ de adjuntos PDF/EML | No | Líneas del pedido | REQ-279: si `totalSolicitudDetectado` > 0 y difiere del total OV, muestra aviso; no bloquea confirmar | Sin mensaje de bloqueo: es informativo. | Front |
| Bloqueo de edición (soft-lock) | Estado (usuario, última actividad, nombre) | No | Caduca a los 90 s sin latido; el latido se refresca cada 30 s | Sin bloqueo | No | Usuario que abre el pedido | REQ-180: si otro usuario tiene un bloqueo vigente (no caducado), el formulario se abre en solo lectura; si el bloqueo es propio o está caducado, se abre en edición y el usuario toma el bloqueo; al cerrar se libera | Descripción del modal: «<Nombre> está editando este pedido · solo lectura». Botón de guardar deshabilitado con el texto «Solo lectura: otro usuario está editando». | Front / BD |
| Cabecera sellada por el usuario | Texto (notas generales, centro de consumo, orden de compra, fecha de entrega, dirección, contacto, teléfono, correo) | No | — | — | No | Guardado desde el formulario | REQ-281: al guardar desde el formulario se guarda un sello con esos ocho valores; al reabrir manda el sello, incluido el vacío, sobre la información de BD y sobre lo que sugiere Mateo; sin sello (pedido que aún no se guardó desde el formulario) rige BD y luego Mateo; el sello se recorta con trim | Sin mensaje de error: un valor vacío en el sello se respeta y no se vuelve a rellenar. | Front |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
|---|---|---|---|
| Folio de factura | — | No | — |
| Fecha de creación | — | Sí (solo lectura) | — |
| Denominación comercial | En Datos del pedido, después de código de cliente (REQ-241) | No | — |
| RFC | En Datos del pedido, después de denominación comercial (REQ-259) | Sí (solo lectura) | — |
| Moneda | En Datos del pedido, junto a centro de consumo / OC (REQ-278) | No | — |
| Día de la semana | En Entrega, junto a Fecha de entrega (REQ-257) | Sí (solo lectura) | — |
| Hora desde | En Entrega, después de Día de la semana (REQ-278) | No | — |
| Hora hasta | En Entrega, después de Hora desde (REQ-278) | No | — |
| Precio unitario (línea) | Dentro de la grilla de líneas del pedido | No | — |
| Contacto del cliente | En Entrega, después de Hora hasta y antes de teléfono (REQ-278) | No | — |
| Teléfono del contacto | En Entrega, después de contacto (REQ-278) | No | — |
| Correo del contacto | En Entrega, después de teléfono y antes de dirección (REQ-278) | No | — |
| Dirección de entrega | En Entrega, a ancho completo, después de correo y antes de notas (REQ-278); icono mapa abre modal de pin (REQ-251) | No | — |
| Latitud / longitud de entrega | No son campos de texto: se setean desde el modal de mapa (REQ-251) | No | — |
| Notas generales del pedido | Último campo del bloque Entrega (REQ-278; deja de ir arriba) | No | — |
| Prioridad | Oculta en UI (REQ-278); valor por defecto «Normal» se mantiene en estado | Sí (no visible) | — |
| Aviso total solicitud vs OV | Banner encima del formulario cuando aplica (REQ-279) | Sí (solo lectura) | — |
| Todos los campos del formulario en modo solo lectura | No aplica: ningún campo recibe foco ni se puede editar | Sí, todos (REQ-180) | — |
| Botón Actualizar / Confirmar en modo solo lectura | No aplica | Sí (REQ-180); los iconos Guardar avance y Eliminar tarea del pie no se muestran y el botón Cancelar pasa a decir «Salir» | — |

### Tabla 3 — Pre-llenado

| Campo | ¿Tiene pre-llenado? | Origen del pre-llenado (única respuesta) | Editable manualmente por el usuario |
|---|---|---|---|
| Folio de factura | Sí | Información de BD | Sí |
| Fecha de creación | Sí | Información de BD | No |
| Denominación comercial | Sí | Información de BD (override ?? apodo sync) | Sí |
| RFC | Sí | Información de BD | No |
| Moneda | Sí | Extracción IA / Información de BD | Sí |
| Día de la semana | Sí | Derivado de Fecha de entrega (Front) | No |
| Hora desde | Sí | Extracción IA / Información de BD | Sí |
| Hora hasta | Sí | Extracción IA / Información de BD | Sí |
| Precio unitario (línea) | Sí | Extracción IA / Información de BD | Sí |
| Dirección de entrega | Sí | Información de BD (si hay sello del usuario, manda el sello, REQ-281) | Sí |
| Latitud de entrega | Sí | Información de BD (`entrega_lat`) o geocodificación del mapa (REQ-251) | Sí (vía mapa) |
| Longitud de entrega | Sí | Información de BD (`entrega_lng`) o geocodificación del mapa (REQ-251) | Sí (vía mapa) |
| Notas generales del pedido | Sí | Extracción IA / Información de BD (si hay sello del usuario, manda el sello, REQ-281) | Sí |
| Aviso total solicitud vs OV | Sí | Extracción IA / adjuntos vía resolve-occ (Front) | No |
| Contacto del cliente | Sí | Información de BD (si hay sello del usuario, manda el sello, REQ-281) | Sí |
| Teléfono del contacto | Sí | Información de BD (si hay sello del usuario, manda el sello, REQ-281) | Sí |
| Correo del contacto | Sí | Información de BD (si hay sello del usuario, manda el sello, REQ-281) | Sí |
| Fecha de entrega | Sí | Información de BD (si hay sello del usuario, manda el sello, REQ-281) | Sí |
| Centro de consumo | Sí | Información de BD (si hay sello del usuario, manda el sello, REQ-281) | Sí |
| Orden de compra | Sí | Información de BD (si hay sello del usuario, manda el sello, REQ-281) | Sí |

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
| Moneda | combobox / textbox Moneda en Datos del pedido | MXN |
| Día de la semana | textbox "Día de la semana" | Día derivado de la fecha de entrega (solo lectura) |
| Hora desde | textbox / time "Hora desde" | 06:00 |
| Hora hasta | textbox / time "Hora hasta" | 08:00 |
| Precio unitario (línea) | spinbutton / textbox de precio en línea | vacío o 0 al confirmar |
| Contacto del cliente | textbox "Contacto del cliente" | Ana Pérez |
| Dirección de entrega | textbox / textarea de dirección de entrega | Av. Prueba 100 |
| Notas generales del pedido | textbox / textarea de notas generales | Entregar en andén 2 |

### Notas y justificaciones

Esta versión del schema documenta el lote UI OV/correo Cypher (REQ-276…294) sobre el schema previo (REQ-241/252/254/257/259/235). Contrato Front↔Back de denominación cubierto por `map-denominacion-detalle.test.ts` y `orden-venta-capture-fields.test.ts`. Layout Entrega y orden de campos: `orden-campos-datos-pedido.ts`, `OrdenVentaCaptureFormEntrega.tsx`, `OrdenVentaCaptureFormPedido.tsx`, `OrdenVentaCaptureFormProgramacion.tsx`.

Orden de los campos (REQ-278): Datos del pedido lleva cliente, código, denominación comercial, RFC (solo lectura), fecha de creación y folio (solo al editar), orden de compra, centro de consumo y **moneda**. Entrega lleva, en este orden: fecha de entrega, día de la semana (derivado, solo lectura), Hora desde, Hora hasta, contacto, teléfono, correo, dirección de entrega (a ancho completo) y **notas generales al final**. Prioridad queda oculta (estado interno «Normal»). La versión 1.5 ubicaba notas/prioridad/moneda arriba en Entrega y dirección antes de contacto; ya no coincide con el código.

REQ-279: el aviso de total de solicitud vs total OV es informativo (`avisos-validacion-ov.ts`). El total puede venir del cuerpo/adjuntos en extracción IA o, al reabrir, de `useLeerTotalDesdeAdjuntos` → `GET /api/ov-adjuntos/resolve-occ?path=…` (`totalSolicitud`). No bloquea confirmar ni exige capa Back/BD nueva en este formulario.

REQ-286/277: `sanitizeNotasGeneralesPedido` evita inventar «Entrega … / Destino:» y quita líneas que solo duplican campos parametrizados.

Confirmar no exige dirección no vacía; la obligatoriedad visual vía `missingFields` es orientativa desde el origen IA.

Fecha de creación solo aparece al editar un pedido. El input es de solo lectura: muestra formatDateTime de created_at, y si no hay, de fecha_pedido. No se envía al guardar.

RFC (REQ-259) es solo lectura: se toma de `comprador.rfc` / `comprador_rfc` al cargar el detalle o al elegir comprador. No se edita ni se envía como campo propio del payload de captura.

Día de la semana (REQ-257) es solo lectura: `diaSemanaEntregaEsTitulo(fechaEntrega)`. Vacío si no hay fecha de entrega. No se persiste como columna aparte.

Precio unitario (REQ-235): `persist-linea-avance` y `createOrdenVenta`/`updateOrdenVenta` aceptan precio vacío o 0 en avance y al confirmar; se normaliza a 0. La cantidad > 0 sigue exigida solo al confirmar (REQ-138).

El campo Folio es opcional: el input muestra el placeholder "Opcional" y el hint "Opcional. Se muestra en el detalle de la orden de trabajo." Vacío se guarda. No hay máximo de longitud en el input. Al guardar se recorta el texto con trim.

No hay capa Back ni BD nueva para el texto del folio. El valor vive en orden_venta_surtido_captura.payload, clave facturaOkFolio.

El modal no se cierra al tocar el fondo (closeOnBackdrop es false). Si hay progreso sin guardar, Cancelar abre el diálogo "¿Salir del pedido?" con "Salir" y "Seguir editando".

En edición de un pedido que ya no está por confirmar, el botón de guardar dice "Actualizar". Si todavía está por confirmar, dice "Confirmar". Título y descripción del modal se resuelven con `tituloCreateModalOv` / `descriptionCreateModalOv`: en edición no hay subtítulo (REQ-220), el título identifica el pedido. Eliminar tarea y Guardar avance van como iconos en el pie, junto a Cancelar (REQ-232); el encabezado conserva solo el botón de Cypher. Etiquetas de OT usan "TAREA" / "Órdenes de tarea" (REQ-214/225).

REQ-180 (bloqueo de edición): `decideOvEditLockMode` abre el formulario en solo lectura cuando otro usuario tiene un bloqueo vigente (`hasActiveForeignOvEditLock`); el bloqueo se guarda en las columnas `edit_locked_by`, `edit_locked_at` y `edit_locked_nombre` de `orden_venta` (migración 117_orden_venta_edit_lock de `polaria-wms-db`). En solo lectura el cuerpo del modal va dentro de un `fieldset` deshabilitado (`OrdenVentaModalReadonlyBody`), el título es «Ver · <folio>» o «Ver pedido» y no se muestran las acciones del pie. El latido (`OV_EDIT_LOCK_HEARTBEAT_MS`, 30 s) refresca `edit_locked_at`; sin latido durante `OV_EDIT_LOCK_STALE_MS` (90 s) el bloqueo se considera caducado. El listado consulta la presencia cada 4 s (`OV_EDIT_PRESENCE_POLL_MS`). No hay capa Back nueva: el servicio `ov-edit-lock.service` escribe desde el front.

REQ-281 (sello del usuario): `sellarCabeceraUsuarioEnOrigen` guarda el sello en cada renglón de `origen_correo` al enviar (`payload-envio-ov.ts`); `leerCabeceraUsuarioSello` lo lee al reabrir y `resolveCampoConSelloUsuario` decide el valor: con sello manda el sello; sin sello, BD y luego Mateo. Al materializar la OV desde el origen (`materializar-lineas-desde-origen.ts`) los campos de cabecera solo se rellenan si la OV no tiene sello, para no pisar lo que el usuario dejó.

REQ-287: la especificación de línea muestra la madurez con la etiqueta «Madurez: <nivel>» y no la repite si el texto ya la trae (`formatMadurezConEtiqueta`, `textoYaTraeMadurez`). REQ-297 (impresión en carta) no cambia campos de este formulario.

La prueba automatizada del Nivel 2 (Tabla 4) cubre el modo edición. El modo solo lectura exige dos sesiones de usuarios distintos sobre la misma orden, y se recorre a mano en el checklist del lote.

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.7 |
| Fecha de aprobación | 11/11/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
