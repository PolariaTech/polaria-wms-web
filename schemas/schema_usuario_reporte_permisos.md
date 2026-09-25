### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Permisos de reportes embed por usuario |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | Sí |
| Campos nuevos o modificados | Usuario, Reportes (checks) — formulario nuevo |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 24/09/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Usuario | Selección (picker) | Sí | idUsuario de la cuenta | "" | No | Lista de usuarios admin | Submit deshabilitado sin usuario; GET/PUT validan misma cuenta | idUsuario es requerido. / El usuario no pertenece a esta cuenta. / Sesión requerida. / Solo el administrador de cuenta puede gestionar permisos de reportes. | Front, Back, BD |
| Reportes | Conjunto de checkboxes (uuid[]) | No | Solo ids de cuenta_reporte_embed de la cuenta; vacío = sin grants | grantedIds del GET | No | Usuario seleccionado | replaceUsuarioReporteEmbedGrants reemplaza el set completo | No se pudieron cargar los permisos. / No se pudieron guardar los permisos. / Cuerpo inválido. | Front, Back, BD |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
| --- | --- | --- | --- |
| Usuario | 1 | Sí mientras isLoading/isSubmitting en picker hijo | — |
| Reportes (checks) | 2+ | Sí mientras isLoading o isSubmitting | — |

### Tabla 3 — Pre-llenado

| Campo | ¿Tiene pre-llenado? | Origen del pre-llenado (única respuesta) | Editable manualmente por el usuario |
|---|---|---|---|
| Usuario | No | — | Sí (picker) |
| Reportes | Sí | Información de BD (grants del usuario) | Sí |

### Notas y justificaciones

`closeOnBackdrop` / `closeOnEscape` se desactivan mientras el picker de usuario está abierto. Capas Back: rutas `GET/PUT /reportes-embed/permisos`. BD: `usuario_reporte_embed` (migración 084).

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.0 |
| Fecha de aprobación | 24/09/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
