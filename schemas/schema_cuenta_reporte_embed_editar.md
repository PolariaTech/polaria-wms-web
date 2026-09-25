### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Editar reporte embed |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | Sí |
| Campos nuevos o modificados | Nombre, URL, Estado — formulario nuevo |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 24/09/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nombre del reporte | Texto | Sí | text; se recorta | reporte.descripcion | No | Reporte abierto | — | La descripción del reporte es obligatoria. | Front, Back, BD |
| URL del reporte | URL (http/https) | Sí | URL válida; protocolo http o https | reporte.embedUrl | Sí (por cuenta + reporte_id) | Reporte abierto | Si la URL trae otro UUID, se actualiza reporte_id | La URL del reporte es obligatoria. / Ingresa una URL válida (https://…). / La URL del reporte debe empezar con http o https. / No se encontró el reporte. / Esta cuenta ya tiene un reporte con ese identificador. / No se pudo actualizar el reporte. | Front, Back, BD |
| Estado | Selección (Activo / Inactivo) | Sí | boolean | reporte.estaActivo | No | Reporte abierto | — | — | Front, Back, BD |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
| --- | --- | --- | --- |
| Nombre del reporte | 1 | No (Sí mientras isSubmitting) | Sí, al abrir el modal |
| URL del reporte | 2 | No (Sí mientras isSubmitting) | — |
| Estado | 3 | No (Sí mientras isSubmitting) | — |

### Tabla 3 — Pre-llenado

| Campo | ¿Tiene pre-llenado? | Origen del pre-llenado (única respuesta) | Editable manualmente por el usuario |
|---|---|---|---|
| Nombre del reporte | Sí | Información de BD | Sí |
| URL del reporte | Sí | Información de BD | Sí |
| Estado | Sí | Información de BD | Sí |

### Notas y justificaciones

El modal no cierra por clic afuera ni Escape mientras `isSubmitting`.

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.0 |
| Fecha de aprobación | 24/09/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
