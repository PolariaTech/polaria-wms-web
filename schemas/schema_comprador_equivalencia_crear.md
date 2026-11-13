### Datos del formulario

| Campo | Valor |
|---|---|
| Formulario | Crear equivalencia de producto (comprador) |
| Proyecto / repo | polaria-wms-web |
| Protocolo de referencia | PROTOCOLO_DE_VALIDACION_DE_FORMULARIOS_v1.1.md |
| Campos nuevos o modificados | Todos (schema nuevo). POL-419: varias frases por producto; los productos que ya tienen frase ya no se deshabilitan. |
| ¿Vive en un modal? | Sí. Con datos sin guardar: el clic en el fondo no cierra (`closeOnBackdrop` solo si no hay cambios y no está guardando). Escape y el botón «Cerrar» sí cierran y descartan lo escrito; no hay diálogo de confirmación de descarte. Mientras `isSubmitting`, no cierra. |
| ¿Algún campo se pre-llena automáticamente (Extracción IA, información de BD, o ambos)? | Sí (información de BD: comprador, catálogo, precio de lista). |
| Responsable (Desarrollador) | Desarrollador frontend |
| Fecha de creación | 13/11/2026 |

### Tabla 1 — Validación de datos (Niveles 1, 3, 4, 5)

| Campo | Tipo de dato | Obligatorio | Rango/Límite | Valor por defecto | Único | Depende de | Regla de dependencia | Mensaje de error | Capas aplicables (Front/Back/BD) |
|---|---|---|---|---|---|---|---|---|---|
| Comprador | Texto | Sí (contexto del modal) | Solo lectura | Código y nombre del comprador abierto | No | El comprador del modal Editar | Si falta: no guarda | No se encontró el comprador. / No se encontró la cuenta activa. | Front, Back, BD |
| Buscar producto | Texto | No | Filtro local; no se persiste | "" | No | Catálogo cargado | Si no hay coincidencias muestra aviso de búsqueda | No hay productos que coincidan con la búsqueda. / No hay productos en el catálogo. / No se pudieron cargar los productos. | Front |
| Código | Texto | No (solo lectura) | Del catálogo | SKU del producto | No | Fila de producto | — | — | Front |
| Nombre | Texto | No (solo lectura) | Del catálogo | Título del producto | No | Fila de producto | — | — | Front |
| Equivalencia (frase) | Texto | No (basta un cambio de frase o de precio) | Máx. 255 caracteres; el modal no recorta, bloquea | "" (frase nueva; no rellena la frase ya guardada) | Sí, por cuenta + comprador + `alias_normalizado` cuando no está vacío (`uq_comprador_producto_alias_frase`, migración 120 de polaria-wms-db) | Producto de la fila | Varias frases por producto: la fila no se deshabilita si ya hay equivalencia. Guardar exige al menos un cambio (`hasAlias` o precio distinto). | La equivalencia de {codigo} supera 255 caracteres. / Este comprador ya usa esa frase para otro producto. / Este comprador ya tiene una equivalencia para ese producto. / No hay cambios para guardar. / No se pudo guardar la equivalencia. | Front, Back, BD |
| Precio | Numérico decimal (entrada es) | No (basta un cambio de frase o de precio) | ≥ 0 si se escribe un valor | Precio vigente de lista | Sí, un solo precio especial por cuenta + comprador + producto (`uq_comprador_producto_alias_precio`, migración 120). Fila solo precio sin frase: `uq_comprador_producto_alias_sin_frase` | Precio de lista y si el producto ya tiene override | Si el producto ya tiene precio especial y se escribe otro, avisa y no guarda. Precio igual a lista se guarda como null (usa lista). | Ingresa un precio válido para {codigo}. / Este cliente ya tiene un precio especial para {titulo}. Cámbialo en la tabla de equivalencias. / Este comprador ya tiene un precio especial para ese producto. | Front, Back, BD |
| Unidad | Texto | No (solo lectura) | Del catálogo | Unidad del producto | No | Fila de producto | — | — | Front |

### Tabla 2 — Interacción (Nivel 2)

| Campo | Orden de tabulación | Deshabilitado | Foco automático (cuándo, si aplica) |
|---|---|---|---|
| Cerrar (encabezado) | 1 | Sí mientras `isSubmitting` | Al abrir, el foco va al propio diálogo (`PolariaFormModal`, `use-modal-focus.ts`); Tab va a Cerrar y Shift+Tab al último control. Al cerrar, vuelve al botón «Crear equivalencia». |
| Comprador | — | Sí (siempre) | — |
| Buscar producto | 2 (si hay más de 4 productos) | Sí mientras `isSubmitting` | — |
| Código | — | Sí (no es input) | — |
| Nombre | — | Sí (no es input) | — |
| Equivalencia (frase) | 3, 5, 7… (una por fila visible, por código) | No. POL-419: **no** se deshabilita si el producto ya tiene frase. Sí mientras `isSubmitting`. | — |
| Precio | 4, 6, 8… (una por fila visible, después de su frase) | No. POL-419: **no** se deshabilita si el producto ya tiene frase. Sí mientras `isSubmitting`. | — |
| Unidad | — | Sí (no es input) | — |
| Cerrar (pie) | Siguiente al último input | Sí mientras `isSubmitting` | — |
| Guardar | Siguiente a Cerrar (pie), igual que el orden visual | Sí si no hay cambios o está cargando | — |

### Tabla 3 — Pre-llenado

| Campo | ¿Tiene pre-llenado? | Origen del pre-llenado (única respuesta) | Editable manualmente por el usuario |
|---|---|---|---|
| Comprador | Sí | Información de BD | No |
| Buscar producto | No | — | Sí |
| Código | Sí | Información de BD | No |
| Nombre | Sí | Información de BD | No |
| Equivalencia (frase) | No (nace vacía para agregar otra frase) | — | Sí |
| Precio | Sí | Información de BD (lista vigente) | Sí |
| Unidad | Sí | Información de BD | No |

### Tabla 4 — Prueba automatizada (Nivel 2)

**Tabla 4.1 — Acceso y botones**

| Campo | Valor |
|---|---|
| Rol con que se inicia sesión | Usuario de Administración de la cuenta |
| Ruta | /dashboard/administracion/asignacion-creacion/compradores |
| Pasos para abrir el formulario | clic button "Editar" del comprador de prueba → clic button "Crear equivalencia" → esperar dialog "Crear equivalencia de producto" |
| Registro que debe existir | Un comprador activo de la cuenta de prueba y al menos un producto de catálogo |
| Archivos del formulario | src/modules/admin-panel/compradores/components/CompradorAliasCreateModal.tsx; src/modules/admin-panel/compradores/utils/comprador-alias-reglas.ts; src/modules/admin-panel/compradores/services/comprador-producto-alias.service.ts |
| Botón Guardar | button "Guardar" |
| Botón Cancelar / Cerrar | button "Cerrar" |
| Diálogo de descarte: botón que confirma descartar | — (no hay diálogo; Cerrar y Escape descartan) |
| Diálogo de descarte: botón para seguir editando | — |
| Botón de la advertencia no-saltable | — (no hay advertencia de discrepancia IA) |

**Tabla 4.2 — Campos**

| Campo | Localizador | Valor de prueba |
|---|---|---|
| Comprador | textbox "Comprador" | — |
| Buscar producto | textbox "Buscar producto" | DICOK |
| Código | — | — |
| Nombre | — | — |
| Equivalencia (frase) | textbox "Equivalencia DICOK" | Pechuga |
| Precio | textbox "Precio DICOK" | 55 |
| Unidad | — | — |

### Notas y justificaciones

POL-419: varias frases por (cuenta, comprador, producto). El selector de producto **ya no deshabilita** filas con frase existente.

Unicidad (migración 120 de polaria-wms-db, índices en `comprador_producto_alias`):
- `uq_comprador_producto_alias_frase`: `(codigo_cuenta, id_comprador, alias_normalizado)` WHERE `alias_normalizado <> ''` — una frase normalizada por comprador.
- `uq_comprador_producto_alias_precio`: `(codigo_cuenta, id_comprador, id_producto)` WHERE `precio IS NOT NULL` — un solo precio especial por producto y comprador.
- `uq_comprador_producto_alias_sin_frase`: `(codigo_cuenta, id_comprador, id_producto)` WHERE `alias_normalizado = ''`.

Mensajes de unique (`traducirErrorAlias`): «Este comprador ya usa esa frase para otro producto.» / «Este comprador ya tiene un precio especial para ese producto.» / «Este comprador ya tiene una equivalencia para ese producto.»

Aviso previo de precio especial (antes de llamar al servicio): «Este cliente ya tiene un precio especial para {titulo}. Cámbialo en la tabla de equivalencias.»

Código, nombre y unidad no se validan: no son inputs. Buscar producto no llega a Back/BD. Comprador no se edita aquí; falta de cuenta o comprador se corta en Front.

Foco al abrir y foco atrapado: antes de este cambio, `PolariaFormModal` no movía el foco al modal ni lo retenía, y Tab o Shift+Tab pasaban a los controles del modal Editar de atrás. Se corrigió en el componente compartido (`src/components/shared/form/use-modal-focus.ts`), así que el arreglo vale para todos los modales que lo usan:
- Al abrir, el foco va al diálogo (respeta `autoFocus`).
- Tab y Shift+Tab dan la vuelta solo dentro del modal de más arriba (el último `[aria-modal="true"]` del documento): no le roban el foco a una confirmación con portal (`PolariaConfirmDialog`) ni a un popover.
- Al cerrar, el foco vuelve al control que abrió el modal.

### Checklist de prueba manual (Demo, 13/11/2026, 1366×768, comprador 1052001550)

- [PASS] Nivel 1: en Equivalencia 115001456 escribir 259 caracteres y Guardar → «La equivalencia de 115001456 supera 255 caracteres.» No guarda.
- [PASS] Nivel 1: el campo Precio filtra al escribir: «abc-» no entra (queda vacío), así que no se pueden escribir letras ni el signo menos. Con un precio mal formado («1.2.3» en 5010000077) y Guardar → «Ingresa un precio válido para 5010000077.» No guarda. El servicio usa el mismo texto (`mensajePrecioInvalido` de `comprador-alias-reglas.ts`).
- [PASS] Nivel 2: dentro del modal, Tab recorre Cerrar (encabezado) → Buscar producto → Equivalencia fila 1 → Precio fila 1 → Equivalencia fila 2 → … → Cerrar (pie) → Guardar. Comprador, código, nombre y unidad no reciben foco.
- [PASS] Nivel 2: al abrir, el foco entra al diálogo «Crear equivalencia de producto». Shift+Tab recién abierto va al último control (Cerrar del pie, porque Guardar está deshabilitado). Tab y Shift+Tab dan la vuelta sin salir al modal Editar.
- [PASS] Nivel 2: Escape cierra «Crear equivalencia» y el foco vuelve a «Crear equivalencia» del modal Editar; un segundo Escape cierra Editar y el foco vuelve al botón «Editar» de la fila.
- [PASS] Nivel 2: con Editar abierto y un `alertdialog` con `aria-modal="true"` agregado al final de `body` (como el portal de `PolariaConfirmDialog`), Tab dentro de la confirmación pasa de su primer botón al segundo: el modal de abajo no roba el foco.
- [PASS] Nivel 2: los productos que ya tienen frase siguen editables: AJO (BOTE 1000G) 115001453 tiene dos frases y sus campos no están deshabilitados. El único campo deshabilitado es Comprador.
- [PASS] Nivel 2: con cambios, el clic en el fondo no cierra el modal. Escape cierra solo este modal (el de Editar sigue abierto) y descarta lo escrito: al reabrir, el campo está vacío.
- [PASS] Nivel 3: sin cambios, Guardar está deshabilitado al abrir el modal y se habilita al escribir un valor válido. Por eso el mensaje «No hay cambios para guardar.» no se puede disparar desde la pantalla.
- [PASS] Nivel 3: NARANJA AMERICANA 115001454 con precio especial 55; escribir 60 y Guardar → «Este cliente ya tiene un precio especial para NARANJA AMERICANA. Cámbialo en la tabla de equivalencias.» En la base no se creó ninguna fila.
- [PASS] Nivel 3: «Ajo en bote prueba POL-419» (frase de 115001453) escrita en AJO (BOTE 500G) 115001452 → «Este comprador ya usa esa frase para otro producto.» En la base no se creó ninguna fila.
- [PASS] Nivel 4 / 5: el precio especial de 55 se guardó como una sola fila (frase vacía, precio 55.0000). Los intentos rechazados no dejaron filas, según consulta de solo lectura a `comprador_producto_alias` en Demo.
- [PASS] 390 px: la página no tiene scroll horizontal (`scrollWidth` 390 = `innerWidth` 390) y el modal queda con 16 px de margen a cada lado (16–374). La tabla de productos se desplaza en horizontal dentro de su contenedor (768 px de contenido en 318 px), así que para llegar a Equivalencia y Precio hay que deslizarla. Ese diseño ya existía antes de POL-419.

### Versión y revisión (del schema de ese formulario, no de esta plantilla)

| Campo | Valor |
|---|---|
| Versión del schema | v1.0 |
| Fecha de aprobación | 13/11/2026 |
| Aprobado por | Desarrollador frontend |
| Próxima revisión | Cuando el formulario cambie de campos o de reglas |
