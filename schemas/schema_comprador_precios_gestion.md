### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Gestión de precios de compradores (exportar / importar / imprimir) |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | Sí |
| Campos nuevos o modificados | Filtros de exportación (grupos + productos), alcance de impresión, archivo Excel de importación |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 25/09/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Archivo Excel (importar) | Archivo (.xlsx / .xls) | Sí al importar | Filas parseadas por comprador-precios-import | — | No | — | Validación en cliente; aplica a todos los compradores del grupo | Mensajes de import (filas inválidas / sin filas) del util de import | Front, Back, BD |
| Grupos pertenecientes (exportar) | Selección múltiple | Sí al exportar | Hoten 1 / Hoten 2 / Hoten 3 | Todos | No | Opciones fijas de grupo | Al menos un grupo | — | Front |
| Productos (exportar) | Selección múltiple | Sí al exportar | idProducto del catálogo | Todos los del catálogo | No | Lista de productos | Al menos un producto | No hay productos en el catálogo. | Front |
| Alcance de impresión | Selección | Sí al imprimir | `__todos__` o codigoComprador existente | Todos los compradores | No | Lista de compradores del modal | mode todos \| one | No hay filas para imprimir con el alcance seleccionado. | Front |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
| --- | --- | --- | --- |
| Acciones (Exportar / Importar / Imprimir) | 1–3 | Sí mientras isBusy o flags *Disabled | — |
| Grupos / Productos | 1–N (paso exportar) | Sí mientras isExporting | — |
| Alcance de impresión | 1 (paso imprimir) | Sí mientras isPrinting | — |

### Notas y justificaciones

No es un formulario de campos de dominio clásico: orquesta export/import/print. La exportación genera filas por **grupo × producto** (no por comprador individual). La importación expande cada fila de grupo a todos los compradores con ese `grupo`. El modal no cierra por clic afuera mientras `isBusy`.

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.1 |
| Fecha de aprobación | 25/09/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
