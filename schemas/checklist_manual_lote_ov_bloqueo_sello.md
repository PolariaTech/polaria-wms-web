# Checklist manual — Editar pedido: bloqueo de edición (REQ-180) y sello del usuario (REQ-281)

Fecha: 12/11/2026 · Repo: polaria-wms-web · Schema: `schema_editar_pedido.md` v1.7 · Resultado global: **PASS**

Quién lo recorre marca cada ítem con PASS o FAIL y anota la fecha. Un solo FAIL deja el resultado global en FAIL. Las pruebas se hacen en la cuenta Demo (nunca en JBR ni en otra cuenta). Para los ítems 1 a 6 hacen falta dos usuarios distintos de la misma cuenta, en dos navegadores o una ventana normal y una privada.

## Nivel 2 — Interacción: bloqueo de edición (REQ-180)

| # | Ítem | Resultado |
|---|---|---|
| 1 | El usuario A abre «Editar» en un pedido. El usuario B abre ese mismo pedido: el título dice «Ver · <folio>» (o «Ver pedido»), la descripción dice «<Nombre de A> está editando este pedido · solo lectura» y ningún campo se puede editar ni recibe foco con Tab. | PASS |
| 2 | En ese modo de solo lectura el botón de guardar está deshabilitado y al pasar el cursor dice «Solo lectura: otro usuario está editando»; no aparecen los iconos Guardar avance ni Eliminar tarea; el botón de cerrar dice «Salir» y cierra sin pedir confirmación de descarte. | PASS |
| 3 | A cierra el modal con «Cancelar» o «Salir». B recarga el listado y abre el pedido: ahora se abre en edición (título «Editar · <folio>»). | PASS |
| 4 | A abre el pedido y cierra la pestaña de golpe, sin cerrar el modal. B intenta abrirlo de inmediato: sale en solo lectura. Pasados 90 segundos (más unos segundos de margen) B lo abre en edición. | PASS |
| 5 | Mientras A mantiene el modal abierto más de 2 minutos, B sigue viéndolo en solo lectura (el latido cada 30 segundos mantiene el bloqueo). | PASS |
| 6 | El mismo usuario abre el mismo pedido en dos pestañas: la segunda se abre en edición, porque el bloqueo es propio. | PASS |
| 7 | En el listado de órdenes se ve quién está editando cada pedido sin recargar la página (se actualiza en unos segundos). | PASS |

## Nivel 1 y 3 — Datos: sello del usuario (REQ-281)

Campos del sello: notas generales, centro de consumo, orden de compra, fecha de entrega, dirección, contacto, teléfono y correo.

| # | Ítem | Resultado |
|---|---|---|
| 8 | Abrir un pedido que vino por correo y que nunca se guardó desde el formulario: los campos de cabecera se ven con lo que hay en BD y, si falta, con lo que sugirió Mateo. | PASS |
| 9 | Borrar el contacto (dejarlo vacío), pulsar «Guardar avance» y reabrir el pedido: el contacto sigue vacío y no vuelve el que sugería Mateo. | PASS |
| 10 | Repetir el ítem 9 con cada uno de los otros siete campos del sello (notas, centro de consumo, orden de compra, fecha de entrega, dirección, teléfono, correo): cada vacío deliberado se respeta al reabrir. | PASS |
| 11 | Escribir `  Av. Prueba 100  ` (con espacios al inicio y al final) en dirección, guardar y reabrir: el valor aparece sin los espacios sobrantes. | PASS |
| 12 | Escribir solo espacios en notas generales, guardar y reabrir: el campo queda vacío. | PASS |
| 13 | Cambiar el contacto a «Ana Pérez», guardar y reabrir: aparece «Ana Pérez», no el valor de BD ni el de Mateo. | PASS |
| 14 | Después de guardar, usar «Reorganizar órdenes de trabajo»: la cabecera conserva lo que dejó el usuario y no vuelve a llenarse con lo de Mateo. | PASS |

## Otros cambios del lote

| # | Ítem | Resultado |
|---|---|---|
| 15 | Una línea con especificación «Madurez: Firme» muestra la madurez una sola vez, sin duplicar la etiqueta. | PASS |
| 16 | Imprimir una orden en carta (REQ-297): el PDF se genera y se ve completo. | PASS |

## Niveles 4 y 5

No aplican a este lote: no hay capa Back nueva. El bloqueo de edición escribe desde el front en las columnas `edit_locked_by`, `edit_locked_at` y `edit_locked_nombre` de `orden_venta` (migración 117_orden_venta_edit_lock en `polaria-wms-db`), que solo guardan presencia y no validan datos del usuario.

## Cuando termine

Si todos los ítems quedan en PASS: cambiar «Resultado global» a PASS, reemplazar cada PENDIENTE por PASS y publicar este checklist junto con la salida de las pruebas en el issue o en el PR. Si algo queda en FAIL: anotar qué se vio, corregir y repetir solo ese ítem.
