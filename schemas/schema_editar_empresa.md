### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Editar empresa |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| Campos nuevos o modificados | rfc, regimen_fiscal, codigo_postal_expedicion, nombre_cuenta_bancaria, banco, clabe, correo_cobranza, serie_factura y logo. rfc, codigo_postal_expedicion y clabe quedan sin validación de formato |
| ¿Vive en un modal? | Sí |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | Sí |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 19/11/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
|---|---|---|---|---|---|---|---|---|---|
| razon_social | Texto | Sí | varchar(255), mínimo 1 carácter tras recortar espacios | empresa.razon_social | No | — | — | La razón social es obligatoria. | Front, Back, BD |
| codigo_empresa | Texto (solo lectura) | Sí | varchar(32) | empresa.codigo_empresa | Sí | — | No se modifica. Identifica la empresa en la URL del PATCH | — | Front, BD |
| telefono | Teléfono internacional | No | Si hay valor, formato internacional; vacío se envía null. Máximo 32 | empresa.telefono o vacío | No | — | — | Ingresa un número de teléfono válido. | Front, Back, BD |
| estado | Selección | Sí | Activa o Inactiva | empresa.esta_activa | No | — | — | — | Front, Back, BD |
| rfc | Texto | No | Sin máximo. Vacío se envía null | empresa.rfc o vacío | No | — | — | — | Front, Back, BD |
| regimen_fiscal | Texto | No | 3 dígitos. Vacío se envía null | empresa.regimen_fiscal o vacío | No | — | — | El régimen fiscal no es válido. | Front, Back, BD |
| codigo_postal_expedicion | Texto | No | Sin máximo. Vacío se envía null | empresa.codigo_postal_expedicion o vacío | No | — | — | — | Front, Back, BD |
| nombre_cuenta_bancaria | Texto | No | Sin máximo. Vacío se envía null | empresa.nombre_cuenta_bancaria o vacío | No | — | — | — | Front, Back, BD |
| banco | Texto | No | Sin máximo. Vacío se envía null | empresa.banco o vacío | No | — | — | — | Front, Back, BD |
| clabe | Texto | No | Sin máximo. Vacío se envía null | empresa.clabe o vacío | No | — | — | — | Front, Back, BD |
| correo_cobranza | Correo | No | Patrón ^[^@ ]+@[^@ ]+[.][^@ ]+$. Vacío se envía null | empresa.correo_cobranza o vacío | No | — | — | El correo de cobranza no es válido. | Front, Back, BD |
| serie_factura | Texto | No | Sin máximo. Vacío se envía null | empresa.serie_factura o vacío | No | — | — | — | Front, Back, BD |
| logo | Archivo | No | Máximo 1048576 bytes. Solo image/jpeg o image/png. Omitir el archivo conserva logo_path. Quitar el logo guardado exige una acción explícita | empresa.logo_path o vacío | No | — | — | El logo supera 1 MB. / El logo debe ser JPEG o PNG. | Front, Back |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
|---|---|---|---|
| razon_social | 1 | No | Sí, al abrir el modal |
| codigo_empresa | 2 | Sí | — |
| telefono | 3 | No | — |
| estado | 4 | No | — |
| rfc | 5 | No | — |
| regimen_fiscal | 6 | No | — |
| codigo_postal_expedicion | 7 | No | — |
| nombre_cuenta_bancaria | 8 | No | — |
| banco | 9 | No | — |
| clabe | 10 | No | — |
| correo_cobranza | 11 | No | — |
| serie_factura | 12 | No | — |
| logo | 13 | No | — |

### Tabla 3 — Pre-llenado

| Campo | ¿Tiene pre-llenado? | Origen del pre-llenado (única respuesta) | Editable manualmente por el usuario |
|---|---|---|---|
| razon_social | Sí | Información de BD | Sí |
| codigo_empresa | Sí | Información de BD | No |
| telefono | Sí | Información de BD | Sí |
| estado | Sí | Información de BD | Sí |
| rfc | Sí | Información de BD | Sí |
| regimen_fiscal | Sí | Información de BD | Sí |
| codigo_postal_expedicion | Sí | Información de BD | Sí |
| nombre_cuenta_bancaria | Sí | Información de BD | Sí |
| banco | Sí | Información de BD | Sí |
| clabe | Sí | Información de BD | Sí |
| correo_cobranza | Sí | Información de BD | Sí |
| serie_factura | Sí | Información de BD | Sí |
| logo | Sí | Información de BD | Sí |

### Tabla 4 — Prueba automatizada (Nivel 2)

**Tabla 4.1 — Acceso y botones**

| Campo | Valor |
|---|---|
| Rol con que se inicia sesión | Configurador |
| Ruta | /configurador/creacion/empresas |
| Pasos para abrir el formulario | clic button "Editar" → esperar dialog "Editar empresa" |
| Registro que debe existir | La empresa Y9IHZ con su ficha fiscal |
| Archivos del formulario | src/modules/configurator/empresas/components/EmpresaEditModal.tsx; src/modules/configurator/empresas/services/empresas.service.ts |
| Botón Guardar | button "Guardar" |
| Botón Cancelar / Cerrar | button "Cancelar" |
| Diálogo de descarte: botón que confirma descartar | button "Salir" |
| Diálogo de descarte: botón para seguir editando | button "Seguir editando" |
| Botón de la advertencia no-saltable | — |

**Tabla 4.2 — Campos**

| Campo | Localizador | Valor de prueba |
|---|---|---|
| razon_social | textbox "Razón social" | Aguacates de puebla |
| codigo_empresa | textbox "Código empresa" | Y9IHZ |
| telefono | textbox "Teléfono" | +573001112233 |
| estado | combobox "Estado" | Activa |
| rfc | textbox "RFC" | APU210325668 |
| regimen_fiscal | textbox "Régimen fiscal" | 601 |
| codigo_postal_expedicion | textbox "Código postal de expedición" | 77560 |
| nombre_cuenta_bancaria | textbox "Nombre de la cuenta" | Aguacates de Puebla |
| banco | textbox "Banco" | BBVA |
| clabe | textbox "CLABE" | 012528001186364430 |
| correo_cobranza | textbox "Correo de cobranza" | cobranza@aguacatesdepuebla.com |
| serie_factura | textbox "Serie" | CS- |
| logo | textbox "Logo" | — |

### Notas y justificaciones

El pre-llenado viene de una sola fuente, la fila de la empresa, así que no hay advertencia de discrepancia. Nombre de cuenta, banco, serie y estado no tienen mensaje de error: estado solo admite Activa o Inactiva, y los otros tres aceptan cualquier texto. El logo visible sale de logo_path. Si el usuario no elige un archivo nuevo, el PATCH no lo borra. Quitar el logo ya guardado es una acción aparte. El código no se envía como cambio. Un formato inválido no llama a updateEmpresaConfigurator.

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.2 |
| Fecha de aprobación | 20/11/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
