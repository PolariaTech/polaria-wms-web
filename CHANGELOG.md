# Changelog — polaria-wms-web

Versión de producto alineada con Polaria WMS.

## Sin publicar

### Ventas / OV
- Corregir las OT contra el correo (REQ-187): en el modal «Reorganizar órdenes de trabajo» el botón «Releer correo y archivos» pide al servidor que relea los archivos originales de la OV (correo y PDF, cada PDF por separado) y propone las OT que corresponden según los documentos, con su verificación contra el «Total pedido» de cada uno y el antes/después de OT, renglones e importe. Solo con la OV por confirmar. Al aplicar reemplaza las OT y las líneas del formulario como borrador (los productos que no se reconocen quedan marcados), se puede deshacer y se guarda con el guardado normal; la bitácora registra la corrección. Si un documento declara un total que no cuadra no se ofrece aplicar. Resuelve OV como la 940 (22,260 → 27,905.25) y la 943 (una sola OC → las dos OC, 12 → 24 OT).
- Impresión de OV (REQ-189): a quien tenía la pestaña abierta desde antes de un despliegue le fallaba imprimir con «El correo no fue enviado a la impresora» (en realidad el navegador no podía descargar un archivo de la versión nueva: `Failed to load chunk …`). Ahora ese error muestra «Hay una versión nueva de Polaria» con un botón «Recargar página» (un clic, sin teclas) y ya no se registra como fallo de impresión. Además, el ícono rojo de «correo no enviado» ya no se queda pegado: las marcas locales de la pestaña valen 20 s y después manda el servidor, así que si otro usuario imprime esa OV el ícono se apaga solo.
- Lista de Órdenes de venta (REQ-179): los encabezados «OT» y «OCC» pasan a «Tareas» y «Orden de compra». La columna Tareas amplía su ancho mínimo (de 4 rem a 5 rem) para que el título quepa.
- QR de captura: ya no usa el origin de la pestaña (evita imprimir previews de Vercel con SSO). Usa `NEXT_PUBLIC_APP_URL` de producción; si falta o es preview, no genera el QR.
- Captura QR (REQ-194): Mateo acepta fotos imperfectas de la hoja (~40% de precisión o con señal de lectura). Sigue rechazando si no se ve el papel de surtido/OV.
- Imprimir OV con muchas órdenes de trabajo (REQ-186): el PDF de la hoja (vertical y horizontal) se genera comprimido (`compress: true` en jsPDF). Antes una OV de 18 hojas pesaba ~4,6 MB (≈6 MB en base64) y Vercel rechazaba el envío a `/api/ventas/imprimir-orden` con 413, por lo que salía «El correo no fue enviado a la impresora». Con la compresión pesa ~0,2 MB. Análisis y respaldo (envío en varios correos) en `docs/REQ-186-IMPRESION-413.md`.
- «Modificar con IA» desde el «+» de Acciones (REQ-188): el botón (antes «Reorganizar con IA») ya se ve en el Cypher que abre el «+» de la columna Acciones, sin entrar a la OV. Con la OV por confirmar, al pulsarlo se abre la edición del pedido con el chat de la instrucción listo.
- Hoja de la OT (REQ-178): el campo «Cliente» pasa a «Cliente: Razón Social» (razón social del comprador; si no la tiene, su nombre) y debajo se agrega «Cliente: Denominación Comercial» (el campo `apodo` del comprador, vacío si no lo tiene). Aplica al HTML, al PDF vertical y al PDF horizontal. Se reduce el espacio de Incidencias para que la hoja siga cabiendo en una sola carta.
- Reorganizar órdenes de trabajo con IA (REQ-125, POL-391): botón «Reorganizar con IA» en la sección «Órdenes de trabajo» del Cypher, solo con la OV por confirmar y una o más OT. Abre un modal junto al Cypher donde se escribe la instrucción (juntar, dividir, mover renglones), se revisa la propuesta («5 OT → 3 OT») y se confirma o rechaza; al rechazar se puede refinar. Al confirmar el cambio queda como borrador del formulario: mueve los renglones y reasigna las líneas a la vez, y nada se guarda hasta pulsar el disquete o Confirmar. «Deshacer» restaura el estado anterior mientras no se guarde. Al guardar queda una entrada en la bitácora con la instrucción, el resumen y los movimientos. Requiere el endpoint `POST /ventas/ordenes/:id/ordenes-trabajo/propuesta-reagrupacion` de `polaria-wms-api` (POL-390).

### Pruebas
- Suite del front en verde salvo `sales.service.test.ts` (POL-394): se actualizaron 15 pruebas que habían quedado viejas frente al código (ventana de 7 días de `ORDERS_VISIBLE_DAYS`, selector de contraseña en el login, `useCompany` en el hub y el dashboard, «Impresoras» fuera del panel de asignación, botón «Ver detalle» en la lista de OV y `tipo_producto` en el catálogo de alias). Sin cambios de código de producto.

## 2.12.86 — 2026-10-26

### Ventas / OV
- OCC: extracción `REQUISICIÓN #` (no SKU Artículo / rAutorizado); PO/OC / Oc Generada intactos.
- Editar OV: folio visible en título (`Editar · OV-…`).
- Confirmación antes de salir a Mateo IA con modal OV abierto.
- Tickets Baja: adjuntos origen, impresión/PDF día, sync notas OT, prompts Mateo y UX de captura.

### Versión
- Producto `2.12.86`.

## 2.12.54 — 2026-10-20

### Ventas / OV
- Formulario OV: label **Centro de consumo** (sin «/ cocina»); oculto Andén / punto de recepción.
- Cypher 03 renombrado a **Correo vs Mateo IA vs usuario**.
- Cypher Alistamiento: folio manuscrito + checks Alistó/Revisó por línea; sin checks duplicados en el panel derecho; tabla en una línea con scroll horizontal.
- Cypher: oculto el botón **Fotos** del pie (sigue VER en la card de la hoja).

### Versión
- Producto `2.12.54`.

## 2.12.53 — 2026-10-20

### Administración
- Asignación y creación: botón **Cliente** (antes Compradores) con icono de persona; listado y modales con etiquetas Cliente/Clientes.
- Tabla y picker de clientes: columna **D. Comercial** (`apodo`) y búsqueda por ese campo; pie «Mostrando x–x de y» en el picker de OV.

### Ventas / OV
- Tabla OV: tooltips en el punto SLA (en tiempo / en riesgo / atrasada / completada).
- Crear OV: sin `+`/X en el header (solo Cancelar); Cypher `+` solo en edición.
- Cypher: nueva etapa **03 Cliente vs Mateo IA** (Datos generales + tablas por OT: Correo / Mateo / Usuario / Coincidencia); renumeración Alistamiento 04 → Bitácora 06.
- Cliente vs Mateo: en por confirmar Usuario = Pendiente; Mateo muestra sugerencias de catálogo (no eco del correo); scroll-spy del nav corregido (secciones altas y final → Bitácora).

### Versión
- Producto `2.12.53`.

## 2.12.52 — 2026-10-20

### Ventas / OV
- Cypher **Bitácora**: puntos de color por tipo de evento (creación, progreso, operación, aviso SLA, alerta) + badge de autor y callout de límite si viene en el mensaje.

### Versión
- Producto `2.12.52`.

## 2.12.51 — 2026-10-20

### Ventas / OV
- Cypher **Alistado**: check «Todas las OTs fueron escaneadas», tabla OT / Destino / Firmó la hoja (Despachó) / Fecha, y resumen surtidas/parciales/no surtidas si hay cantidades preparadas.

### Versión
- Producto `2.12.51`.

## 2.12.50 — 2026-10-20

### Ventas / OV
- Cypher **Alistamiento**: cards por OT con cocina, productos (pedida + especificación), firma **Despachó**, fecha de escaneo y estados Escaneada / Impresa sin escanear.

### Versión
- Producto `2.12.50`.

## 2.12.49 — 2026-10-20

### Ventas / OV
- Picker central de OT eliminado (detalle y edición): la elección de OT vive solo en Cypher.
- Por confirmar: primero pantalla Mateo; al terminar se abren formulario + Cypher.
- Detalle: Cypher se abre siempre al ver la OV (también con 1 sola OT).
- Fotos desde Cypher: solo de la OT seleccionada; botón deshabilitado si esa OT no tiene fotos; visualizador dock-left junto a Cypher.
- Auth: `refreshAuthTokens` tolera `Failed to fetch` sin tumbar la UI.

### Versión
- Producto `2.12.49`.

## 2.12.48 — 2026-10-20

### Ventas / OV
- Cypher solo: el shell recibe `dockForCypher` desde `cypherId` — lista a la izquierda a ancho completo hasta Cypher (sin `max-w-6xl` centrado ni overlay).

### Versión
- Producto `2.12.48`.

## 2.12.47 — 2026-10-20

### Ventas / OV
- Cypher solo: la lista reserva el ancho con `padding-right` vía `html[data-cypher-open]` (ya no depende del store/`fixed`), así no queda tapada.

### Versión
- Producto `2.12.47`.

## 2.12.46 — 2026-10-20

### Ventas / OV
- Cypher solo: split como detalle/edición — izquierda fija hasta el borde de Cypher; derecha solo Cypher (sin hueco ni overlay).

### Versión
- Producto `2.12.46`.

## 2.12.45 — 2026-10-20

### Ventas / OV
- Con Cypher abierto solo: la **lista izquierda** usa todo el ancho restante (sale del `max-w-6xl` centrado).

### Versión
- Producto `2.12.45`.

## 2.12.44 — 2026-10-20

### Ventas / OV
- Cypher vuelve a su **ancho fijo**; desde el **+** la lista se ajusta al espacio libre (sin blur), sin agrandar el panel.

### Versión
- Producto `2.12.44`.

## 2.12.43 — 2026-10-20

### Ventas / OV
- Cypher desde el **+**: ocupa **todo el ancho libre** a la derecha; la lista queda en franja usable a la izquierda (sin blur).

### Versión
- Producto `2.12.43`.

## 2.12.42 — 2026-10-20

### Ventas / OV
- Cypher desde el **+** de la tabla: sin desenfoque; la lista se ajusta al ancho libre y sigue seleccionable.

### Versión
- Producto `2.12.42`.

## 2.12.41 — 2026-10-20

### Ventas / OV
- Se quita **Cuerpo del mensaje** del detalle/formulario cuando el correo ya está en Cypher.

### Versión
- Producto `2.12.41`.

## 2.12.40 — 2026-10-20

### Ventas / OV
- Al abrir por confirmar / detalle con Cypher: transición suave (~320ms) — modal primero, luego Cypher desliza y el form se acopla.

### Versión
- Producto `2.12.40`.

## 2.12.39 — 2026-10-20

### Ventas / OV
- OV **por confirmar**: al abrir, se salta el preview; entra al formulario de la 1ª OT con Cypher abierto.

### Versión
- Producto `2.12.39`.

## 2.12.38 — 2026-10-20

### Ventas / OV
- Adjuntos: se eliminan duplicados (p. ej. HTML del .eml + el mismo archivo guardado).

### Versión
- Producto `2.12.38`.

## 2.12.37 — 2026-10-20

### Ventas / OV
- Cypher **Confirmación**: también muestra la OT cuando solo hay **una** (antes se ocultaba).

### Versión
- Producto `2.12.37`.

## 2.12.36 — 2026-10-20

### Ventas / OV
- Cypher correo: el cuerpo ya no abre modal; mismo alto con **scroll** para leerlo completo.

### Versión
- Producto `2.12.36`.

## 2.12.35 — 2026-10-20

### Ventas / OV
- Detalle de venta: se quita el bloque **Log** (el historial queda solo en Cypher → Bitácora).

### Versión
- Producto `2.12.35`.

## 2.12.34 — 2026-10-20

### Ventas / OV
- Cypher **05 Bitácora**: log de la OT seleccionada (creación, confirmación, cambios, alistamiento…); el panel Log del detalle apunta ahí con Cypher abierto.

### Versión
- Producto `2.12.34`.

## 2.12.33 — 2026-10-20

### Ventas / OV
- Adjuntos en Cypher/detalle: grilla responsive (**2 / 3 por fila**), tarjetas cuadradas a todo el ancho.

### Versión
- Producto `2.12.33`.

## 2.12.32 — 2026-10-20

### Ventas / OV
- Selector de OT en Cypher: tarjetas cuadradas en grilla de **3 por fila**.

### Versión
- Producto `2.12.32`.

## 2.12.31 — 2026-10-20

### Ventas / OV
- Detalle con varias OT: Cypher abre con el listado en **Confirmación**; a la izquierda se muestra la primera OT (o la que elijas en Cypher). El grid de OT deja de ocupar el formulario.

### Versión
- Producto `2.12.31`.

## 2.12.30 — 2026-10-20

### Ventas / OV
- Cypher en OV **por confirmar**: selector de órdenes de trabajo a la derecha; el badge usa el estado de la lista (no muestra «Confirmada» por error).

### Versión
- Producto `2.12.30`.

## 2.12.29 — 2026-10-20

### Ventas / OV
- **Detalle de venta** con el mismo Cypher que el formulario: botón **+**, panel acoplado a la derecha, se oculta el **+** con Cypher abierto y se cierra al salir.

### Versión
- Producto `2.12.29`.

## 2.12.28 — 2026-10-20

### Ventas / OV
- Al abrir o cancelar/salir del **detalle de venta**, se cierra Cypher (mismo criterio que el formulario de edición).

### Versión
- Producto `2.12.28`.

## 2.12.27 — 2026-10-20

### Ventas / OV
- Al cancelar/salir del formulario de edición, se cierra también Cypher si estaba abierto para ese pedido.

### Versión
- Producto `2.12.27`.

## 2.12.26 — 2026-10-20

### Ventas / OV
- Con Cypher abierto, se oculta el **+** del formulario; al cerrar Cypher vuelve a mostrarse para reabrirlo.

### Versión
- Producto `2.12.26`.

## 2.12.25 — 2026-10-20

### Ventas / OV
- Transición suave al abrir/cerrar Cypher (desliza desde la derecha) y al acoplar el formulario.

### Versión
- Producto `2.12.25`.

## 2.12.24 — 2026-10-20

### Ventas / OV
- Con Cypher abierto, el formulario izquierdo queda a tope (sin redondeo), alineado con Cypher; sin Cypher sigue redondeado.

### Versión
- Producto `2.12.24`.

## 2.12.23 — 2026-10-20

### Ventas / OV
- Cypher arranca **debajo del topbar** (ya no tapa ni se ve cortado); la **X** queda visible.

### Versión
- Producto `2.12.23`.

## 2.12.22 — 2026-10-20

### Ventas / OV
- Cypher: mismo ancho en todos los casos (máx. 38.5rem, cabe en viewport); cabecera con **X** visible; pie sin recortes; mejor ajuste responsive.

### Versión
- Producto `2.12.22`.

## 2.12.21 — 2026-10-20

### Ventas / OV
- Cypher en modo edición: un poco menos de ancho (hasta ~38.5rem).

### Versión
- Producto `2.12.21`.

## 2.12.20 — 2026-10-20

### Ventas / OV
- Cypher en modo edición: un poco más de ancho (hasta ~40rem).

### Versión
- Producto `2.12.20`.

## 2.12.19 — 2026-10-20

### Ventas / OV
- Cypher en modo edición: ligeramente más ancho (hasta ~38rem).

### Versión
- Producto `2.12.19`.

## 2.12.18 — 2026-10-20

### Ventas / OV
- Cypher en modo edición: más ancho (hasta ~36rem).

### Versión
- Producto `2.12.18`.

## 2.12.17 — 2026-10-20

### Ventas / OV
- Cypher en modo edición: un poco más de ancho (hasta ~28rem).

### Versión
- Producto `2.12.17`.

## 2.12.16 — 2026-10-20

### Ventas / OV
- Modo edición + Cypher: Cypher más estrecho, formulario sin cortarse; cierre de Cypher con **X** visible arriba.

### Versión
- Producto `2.12.16`.

## 2.12.15 — 2026-10-20

### Ventas / OV
- En **Editar pedido**, el **+** abre Cypher a la derecha sin cerrar el formulario (queda a la izquierda). Otro clic cierra Cypher.

### Versión
- Producto `2.12.15`.

## 2.12.14 — 2026-10-20

### Ventas / OV
- Modal Editar/Nuevo pedido: botón **+** arriba a la derecha (mismo control que Acciones / Cypher) para cerrar.

### Versión
- Producto `2.12.14`.

## 2.12.13 — 2026-10-20

### Ventas / OV
- Fix: chips de adjuntos de origen con el mismo nombre ya no disparan warning de React por keys duplicadas.

### Versión
- Producto `2.12.13`.

## 2.12.12 — 2026-10-20

### Ventas / OV
- Cypher: el botón **+** de Acciones también queda arriba en el panel de la orden (mismo control para cerrar).

### Versión
- Producto `2.12.12`.

## 2.12.11 — 2026-10-20

### Admin / Catálogo y Ventas
- Pie de tabla: **Mostrando x–x de x** siempre visible (sin la palabra «productos»).
- Picker OV «Seleccionar producto»: contador **Mostrando 1–x** debajo de la línea del pie.

### Versión
- Producto `2.12.11`.

## 2.12.10 — 2026-10-20

### Admin / Catálogo (REQ-040)
- Columna **Tipo producto** (`Producto` / `Servicio`) desde `metadatos_catalogo.tipo_producto` (1 / 3).
- Catálogo, picker de OV y Mateo solo usan mercancía activa (`tipo_producto = 1`); excluyen servicios (`3`).

### Versión
- Producto `2.12.10`.

## 2.12.9 — 2026-10-20

### Ventas / OV / Mateo
- Cypher: Borrar (soft-delete), FAB de Mateo oculto mientras está abierto.
- Cliente / Mateo: criterio más estricto — auto-asignación solo con nombre/código exactos; sugerencias solo con score alto (≥0.55); si no hay señal clara, alerta de cliente faltante.
- Productos / Mateo: match parcial de familia lista variantes y no auto-asigna; buscador por tokens; ANTICIPO no gana por tallas; mismo SKU repetible entre OT.
- Adjuntos EML/Storage, unidades/envase en líneas, OT hijas (agregar/quitar), SLA de cuenta.
- Fecha/hora de entrega del correo sin default silencioso.

### Versión
- Producto `2.12.9` (`POLARIA_PRODUCT_VERSION`, `package.json`, `VERSION`).

## 2.11.29 — 2026-10-15

### Ventas / OV
- Cuerpo del mensaje colapsable (crear, editar y detalle) con chevron; oculto por defecto.
- Adjuntos: subida a Supabase Storage (`ov-adjuntos/{cuenta}`), cards Ver/Descargar en el cuerpo; Cloudinary ya no se usa para PDF de OV (bloqueo ACL).

### Versión
- Producto `2.11.29`.

## 2.11.28 — 2026-10-15

### Impresión
- Fix: el API de imprimir resuelve la impresora con service role en servidor (antes RLS/sin sesión devolvía «No hay impresora configurada» con Brother ya asignada).

### Versión
- Producto `2.11.28`.

## 2.11.27 — 2026-10-15

### Configurador / Impresoras
- Una impresora activa por cuenta; hay que eliminarla para configurar otra.
- Impresión silenciosa Brother/Epson con toasts («Órdenes de trabajo enviadas» / «No hay impresora configurada»).
- UI lista: subtítulo corto, botón **+ Impresora**, header alineado.

### Ventas / OV
- Iconos de estado cliente/producto (teal / naranja / rojo) con tooltip en portal.
- PDF almacén: bordes gruesos solo en campos a mano; Folio factura asociada; Factura (OK) tamaño normal sin Folio; casillas Alistó/Revisó ajustadas.
- Preview/print con surtido; pan en fotos de captura; «Lista de clientes» en sugerencias.

### Versión
- Producto `2.11.27` (`POLARIA_PRODUCT_VERSION`, `package.json`, `VERSION`).

## 2.11.23 — 2026-10-14

### Configurador
- Impresoras viven en el cockpit de cada cuenta (`/configurador/cuentas/[codigo]/impresoras`): cuenta fijada al alta, sin bodega (aplica a toda la cuenta). Tres caminos: QZ Tray, Brother correo, Epson Connect.
- La ruta vieja `/configurador/asignacion/impresoras` redirige a Cuentas.
- Lista de usuarios: se ocultan columnas Teléfono y Producto. Modal crear usuario rediseñado (secciones Identidad / Rol / Credenciales + tarjetas WMS/Mateo).

### Auth
- Login: botón ojo para mostrar/ocultar contraseña.

### Ventas / OV
- Componentes de `ordenes/components` reorganizados en `pages/`, `modals/`, `pickers/`, `orden-trabajo/`, `shared/`.
- Dirección de entrega vacía tras Mateo se marca en rojo (no se pierde el aviso al aplicar OT).
- PDF hoja de almacén: caja **Factura (OK)** al doble de alto con **Folio** (izq) y **Firma** (der); se capturan y persisten `facturaOkFolio` / `facturaOkFirma`.
- Lectura de surtido (Mateo visión): reglas más estrictas de colocación por caja + sanitización Folio↔Firma.

### Versión
- Producto `2.11.23` (`POLARIA_PRODUCT_VERSION`, `package.json`).

## 2.9.17 — 2026-10-08

- Órdenes de venta: al guardar una línea se persiste `match_producto` (texto del cliente, sugerencia de Mateo y producto elegido por el usuario).
- Detalle OV: el panel Log muestra solo el último evento; al hacer click se abre el historial completo. Se ocultan del Log los eventos de “enviado a bodega / emitido”.
- PDF hoja de almacén: etiqueta **Orden de venta**; arriba OV + orden de trabajo, abajo `# de orden del cliente`. Meta **Creada** (`created_at` de la OV) e **Impresa** (momento de generar/imprimir), ambas en `dd/mm/aaaa HH:mm`.
- Captura OV: aviso de cliente habla de **clientes** (no «compradores»). Si Mateo no encuentra match exacto, siempre sugiere el cliente más cercano para aceptar o cambiar; si coincide exacto, no sugiere. Al aceptar la sugerencia solo se enlaza el cliente (no pisa entrega, productos ni precios del pedido).
- Captura OV / notas generales: Mateo prioriza bloques **Observaciones del cliente** (y homólogos: notas/comentarios/indicaciones) para notas de almacén.
- Captura OV / productos: si Mateo o el SKU encuentran el producto, se asigna sin pedir confirmación (variantes de familia no cuentan). Solo se sugiere lo más cercano cuando no hay match; typo real (jass/hass) sigue pidiendo confirmación. Mismo nombre con gramos distintos (260 vs 250) o mismo código en el PDF → se elige solo.

## 2.9.15 — 2026-10-07

- Órdenes de venta: solo **4 estados** de negocio (`por_confirmar`, `confirmada`, `alistamiento`, `alistada` → etiqueta **Alistado**). Valores legados se normalizan al mostrar.
- Hub operador: badge de notificación en **Ventas** con el total de OV en por confirmar; la tarjeta se resalta cuando hay pendientes.

## 2.9.14 — 2026-10-07

- Captura OV (opción mensaje/archivos): matching de catálogo más estricto y consciente de ambigüedad (variantes/tallas, typos jass/hass). Si hay rivales cercanos pide confirmación con UI breve (sin banners largos ni aviso de stock). En discrepancias, «Usar ficha» solo si Mateo no trajo el dato; si ya lo llenó, solo aviso. Fecha atrasada: «Usar hoy». Claves de Mateo se validan contra el catálogo real.

## 2.9.13 — 2026-10-06

- Captura OV con Mateo (mensaje/archivos): líneas sin catálogo ya no se descartan; se muestran con sugerencia cercana, opción de aceptar, elegir otro producto, cambiar o borrar.
- Campo **Notas generales** (antes mal etiquetado “Cuerpo del mensaje”): ahora sí toma `observaciones` / `notasGeneralesAlmacen` de la IA o claves del origen.
- Entrega (dirección, andén, contacto, teléfono, ventana): sale del correo, mensaje o PDF; la ficha del comprador solo cubre lo que Mateo no encontró.

## 2.9.12 — 2026-10-06

- Captura de OV: fecha atrasada con aviso, bodega de origen, pickers, cuerpo del mensaje, textos de cliente.
- Estados **Alistamiento** / **Alistada** tras fotos QR.
- Hoja de almacén: OT `1-2/9` si hay más de 49 productos, notas del correo, incidencias.
- Listado de OV por fecha de creación (más reciente primero).
- Sesión WMS: TTL **7 días** (antes 23); renueva el access JWT (Supabase refresh + retry 401) sin reiniciar ese tope.

## 2.8.20 — 2026-10-01

- Órdenes de venta: OT por pedido+almacén, pager, preview, precios del documento, body correo en notas.
- Captura QR / surtido por OT; tema claro-oscuro en perfil; loaders Mateo.
- Leer pedido con IA sigue en BFF Next (`OPENAI_*` en web). Match estricto de productos/comprador; ficha del comprador no se pisa con basura del PDF.

## 2.8.12 — 2026-09-30

- Órdenes de venta desde mensaje/archivos: órdenes de trabajo por **pedido + almacén**, preview y formulario paginados, precios del documento.
- Buscador del catálogo admin: filtro en cliente al escribir.

## 2.7.15 — 2026-09-25

- Admin de cuenta: **Cargar reportes** (URL) y edición de nombre/URL/estado.
- **Permisos de reportes** por usuario (lupa + tabla) sobre los reportes de la cuenta.
- Maestro **Clientes** renombrado a **Grupos**.
- Compradores: **grupo perteneciente** (catálogo por cuenta), filtros de exportación por grupo/producto/fechas.
- Gestión de precios: plantilla Excel editable (gris → verde), import con preview, **imprimir** lista (no editable, landscape, precio nuevo = importado o 50).
- Impresión/export por grupos y/o compradores (lupa multi-select).
- Sesión WMS/Mateo Support: TTL **7 días** (el handoff SSO sigue en 60 s; tope bajo el límite de `setTimeout` del browser).

## 2.7.5 — 2026-09-17

- Acceso a Polaria WMS y Mateo IA por **usuario** (no por cuenta).
- Configurador → Cuentas: maestros reales de cada cuenta y carga unificada (card QR/SSO).
- La cuenta solo controla si puede iniciar sesión (`esta_activa`).
- Gestión de precios de compradores: plantilla Excel .xlsx en gris, protegida sin contraseña (solo Equivalencia y Precio nuevo).

## 2.4.9 — 2026-09-03

- Alta de comprador por pasos (wizard) y columnas planas en ficha.
- Pedido de venta: autollenado desde ficha del comprador.
- Emisión de OV robusta ante reintento si ya quedó confirmada.
- Captura de OV en columnas + límites/filtros de listados 2026.

## 2.4.3 — 2026-08-29

- Sesión de 12 h y cierre conjunto de Mateo.
- Editar en Creación; alias de producto por comprador.
- Teléfonos con prefijo internacional; enlaces/PDF de Mateo.
