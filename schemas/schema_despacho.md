### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | despacho |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| Campos nuevos o modificados | Todos (formulario nuevo) |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | No |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 10/11/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
|---|---|---|---|---|---|---|---|---|---|
| quien_recibio | Texto | Sí | Máximo 120 caracteres; se recortan espacios al validar | — | No | — | — | Escribe quién es el transportista. / El nombre del transportista es demasiado largo. | Front, Back |
| quien_despacho | Texto | Sí | Máximo 120 caracteres; se recortan espacios al validar | — | No | — | — | Escribe quién despachó la mercancía. / El nombre de quien despachó es demasiado largo. | Front, Back |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
|---|---|---|---|
| quien_recibio | 2 | No | — |
| quien_despacho | 1 | No | — |

### Tabla 4 — Prueba automatizada (Nivel 2)

**Tabla 4.1 — Acceso y botones**

| Campo | Valor |
|---|---|
| Rol con que se inicia sesión | Público, sin sesión |
| Ruta | /despacho?cuenta=023WA |
| Pasos para abrir el formulario | clic button "OV-00000317 CONDOMINIO FHP MAYAKOBA · alistada" → esperar dialog |
| Registro que debe existir | Una orden de venta en estado alistada o alistamiento de la cuenta del enlace |
| Archivos del formulario | src/app/despacho/DespachoPublicoLista.tsx; src/app/despacho/api/route.ts; src/modules/sales/ordenes/despacho/despacho-publico.ts; src/modules/sales/ordenes/despacho/despacho-publico.service.ts |
| Botón Guardar | button "Sí, despachar" |
| Botón Cancelar / Cerrar | button "Cerrar" |
| Diálogo de descarte: botón que confirma descartar | — |
| Diálogo de descarte: botón para seguir editando | — |
| Botón de la advertencia no-saltable | — |

**Tabla 4.2 — Campos**

| Campo | Localizador | Valor de prueba |
|---|---|---|
| quien_recibio | textbox "Transportista" | Luis |
| quien_despacho | textbox "Quién despachó la mercancía" | Ana |

### Notas y justificaciones

quien_despacho es el campo de pantalla "Quién despachó la mercancía" y la clave `despachador` del API. quien_recibio es el campo de pantalla "Transportista" y la clave `transportista` del API. No hay Tabla 3: ningún campo se prellena. El botón "Pasar a despachada" sigue habilitado. Si el texto recortado está vacío, al enviarlo muestra "Escribe quién despachó la mercancía." o "Escribe quién es el transportista.". Si pasa de 120 caracteres, el front y el back muestran "El nombre de quien despachó es demasiado largo." o "El nombre del transportista es demasiado largo." y no recortan el texto. Con los dos nombres válidos abre la pregunta "¿Seguro que quieres despachar {codigo} de {cliente}?". Quien guarda es "Sí, despachar". "Volver" regresa al formulario y conserva lo escrito. "Cerrar" cierra el modal sin diálogo de descarte. Los nombres no tienen columna propia: se guardan en el log de la orden, por eso no hay capa BD.

### Checklist de prueba manual

| Ítem | Resultado |
|---|---|
| Vacío en quien despachó muestra "Escribe quién despachó la mercancía." | PASS |
| Vacío en transportista muestra "Escribe quién es el transportista." | PASS |
| 120 caracteres en los dos campos abre la confirmación y no llama al API | PASS |
| 121 caracteres muestra el mensaje de nombre demasiado largo en cada campo | PASS |
| El botón "Pasar a despachada" sigue habilitado con el formulario vacío | PASS |
| Tabulación: primero "Quién despachó la mercancía", después "Transportista" | PASS |
| Ningún campo toma el foco solo al abrir el modal | PASS |
| Clic fuera del modal con datos sin guardar no lo cierra | PASS |
| "Volver" conserva lo escrito; "Sí, despachar" confirma | PASS |

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.0 |
| Fecha de aprobación | 10/11/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
