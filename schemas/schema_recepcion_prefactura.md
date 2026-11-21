### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Recepción de prefactura |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| Campos nuevos o modificados | Todos (formulario nuevo) |
| ¿Vive en un modal? | No |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | No |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 20/11/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
|---|---|---|---|---|---|---|---|---|---|
| decision | Selección | Sí | Aceptar, Aceptado parcial o Rechazado. Una sola opción. | — | No | — | — | Elige Aceptar, Aceptado parcial o Rechazado. | Front |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
|---|---|---|---|
| decision | 1 | No | Sí, al abrir la página |

### Tabla 4 — Prueba automatizada (Nivel 2)

**Tabla 4.1 — Acceso y botones**

| Campo | Valor |
|---|---|
| Rol con que se inicia sesión | Ninguno. La página es pública, como el despacho. |
| Ruta | /recepcion-prefactura?empresa=Y9IHZ&ov=OV-00002487&ot=unica |
| Pasos para abrir el formulario | Abrir la ruta. El QR de la prefactura lleva a esa dirección. |
| Registro que debe existir | — |
| Archivos del formulario | src/app/recepcion-prefactura/RecepcionPrefacturaForm.tsx; src/app/recepcion-prefactura/page.tsx |
| Botón Guardar | button "Confirmar" |
| Botón Cancelar / Cerrar | button "Volver" |
| Diálogo de descarte: botón que confirma descartar | — |
| Diálogo de descarte: botón para seguir editando | — |
| Botón de la advertencia no-saltable | — |

**Tabla 4.2 — Campos**

| Campo | Localizador | Valor de prueba |
|---|---|---|
| decision | radio "Aceptado parcial" | Aceptado parcial |

### Notas y justificaciones

La empresa, la OV y la OT llegan en el enlace del QR y se muestran; no son campos editables. Confirmar sin opción muestra el mensaje de la Tabla 1. Con una opción marcada, Confirmar pregunta si está de acuerdo con esa operación: aceptar, aceptado parcial o rechazar. Sí, confirmar deja la pantalla en el texto Próximamente. El proceso real de cada opción queda para después, así que no hay capa Back ni BD.

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.0 |
| Fecha de aprobación | 20/11/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario deje de decir Próximamente y ejecute el proceso |
