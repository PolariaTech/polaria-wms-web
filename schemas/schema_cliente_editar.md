### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Editar grupo |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | Sí |
| Campos nuevos o modificados | Copy UI cliente→grupo; mensajes de error actualizados a “grupo” (mismos campos: Código, Nombre, NIT, Teléfono) |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 15/09/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Código | Texto (solo lectura) | Sí | varchar(32) | cliente.codigo | Sí (por cuenta: uq_cliente_cuenta_codigo) | Grupo abierto | No se envía en el update | — | Front, BD |
| Nombre | Texto | Sí | varchar(255) | cliente.nombre | No | Grupo abierto | — | El nombre del grupo es obligatorio. | Front, Back, BD |
| NIT | Texto | Sí | varchar(32); /^[\d-]+$/ y ≥ 5 dígitos | cliente.nit | No | Grupo abierto | normalizeNitInput + isValidNit | El NIT del grupo es obligatorio. / El NIT del grupo no es válido. | Front, Back, BD |
| Teléfono | Teléfono internacional E.164 | No | Si hay valor, isValidInternationalPhone; vacío → null | cliente.telefono o "" | No | Grupo abierto | — | Ingresa un número de teléfono válido. / El teléfono del grupo no es válido. | Front, Back, BD |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
| --- | --- | --- | --- |
| Código | 1 | Sí (siempre, readOnly) | — |
| Nombre | 2 | No | Sí, al abrir el modal |
| NIT | 3 | No | — |
| Teléfono | 4 | No | — |

### Tabla 3 — Pre-llenado

| Campo | ¿Tiene pre-llenado? | Origen del pre-llenado (única respuesta) | Editable manualmente por el usuario |
|---|---|---|---|
| Código | Sí | Información de BD | No |
| Nombre | Sí | Información de BD | Sí |
| NIT | Sí | Información de BD | Sí |
| Teléfono | Sí | Información de BD | Sí |

### Notas y justificaciones

Entidad de BD sigue siendo `cliente`; la UI habla de “grupo”. Sin cuenta: "No se encontró la cuenta activa.". Hint del teléfono: "Opcional. Formato internacional.". Si falla: DomainServiceError o "No se pudo actualizar el grupo.".

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.1 |
| Fecha de aprobación | 24/09/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
