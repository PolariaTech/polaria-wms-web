### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Reorganizar órdenes de trabajo con IA |
| Proyecto / repo | polaria-wms-web (el endpoint vive en polaria-wms-api) |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| Campos nuevos o modificados | Instrucción (v1.1: el límite de 4000 caracteres ahora también se valida en Front). No se agrega ni se modifica ningún campo del pedido |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | No |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 27/10/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
|---|---|---|---|---|---|---|---|---|---|
| Instrucción | Texto libre multilínea | Sí | Mínimo 1 carácter después de recortar espacios; máximo 4000 caracteres (techo provisional definido en el API) | — (vacío) | No | — | — | Front: vacía o solo espacios → sin mensaje, el botón «Generar» permanece deshabilitado; más de 4000 caracteres (contados tras recortar) → «Generar» deshabilitado y el mensaje «La instrucción supera los 4000 caracteres. Acórtala para poder generar la propuesta.» bajo el campo. Back (400): «La solicitud no es válida. Revisa la instrucción e inténtalo de nuevo.» | Front, Back |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
|---|---|---|---|
| Instrucción | 1 (luego Cancelar = 2 y Generar = 3) | No (queda en solo lectura mientras se genera o se revisa una propuesta) | — |

### Notas y justificaciones

- **BD no aplica:** la instrucción no se guarda en ninguna columna propia. Solo se envía al endpoint de propuesta, que no escribe en la base de datos. Al guardar la orden, la instrucción se registra en la bitácora de la OV truncada a 500 caracteres, en un campo que ya existe y ya tiene sus propias validaciones.
- **Obligatorio sin mensaje en Front:** el campo vacío se controla deshabilitando «Generar» mientras no haya texto; no hay envío con campo vacío ni mensaje que mostrar.
- **Límite de 4000 caracteres:** se aplica en Front (botón deshabilitado y mensaje; el textarea no corta lo que se escribe o pega, para no perder texto en silencio) y en Back (400). Es un techo provisional; los límites definitivos (caracteres, turnos, tasa) se fijan después de más pruebas reales con el modelo.
- **Foco automático:** el modal no lo fija de forma explícita. Queda en «—» y se verifica en el checklist manual.
- **Enter:** inserta un salto de línea; no envía. El envío es solo con el botón «Generar».
- **Escape:** cierra únicamente este modal y no el Cypher que está debajo (el modal gestiona su propia tecla Escape).
- **Historial:** las instrucciones rechazadas se reenvían como historial (máximo 20 turnos, cada una con las mismas reglas de longitud que la instrucción).

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.1 |
| Fecha de aprobación | 27/10/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
