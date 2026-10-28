# REQ-186 — «El correo no fue enviado a la impresora» (413 al imprimir una OV)

> Análisis y plan de solución. **Estado: pendiente de implementar.** Bloqueado por el reclamo de REQ-058 (Mauro) sobre `src/modules/sales/ordenes/`, que incluye `ordenes/print/`. Redactado el 2026-10-28.

## 1. Síntoma

Al imprimir una OV grande (ej. OV-00000941), la app muestra «El correo no fue enviado a la impresora». En la consola del navegador:

```
/api/ventas/imprimir-orden:1  Failed to load resource: the server responded with a status of 413
[ov] no se envió el correo a la impresora: No se pudo imprimir desde el servidor.
```

## 2. Causa

- El navegador genera el PDF con jsPDF y lo manda a `POST /api/ventas/imprimir-orden` como **base64 dentro de un JSON** (`print-silent-cuenta.ts`, `tryServerPrint`).
- Vercel rechaza con **413** las peticiones de más de ~4,5 MB **antes de ejecutar la función**. Por eso la ruta nunca corre, no deja logs y la respuesta no trae JSON (el cliente cae al texto genérico «No se pudo imprimir desde el servidor.»).
- Los tres `new jsPDF(...)` se crean **sin `compress: true`**, y jsPDF por defecto no comprime. Cada hoja lleva un QR en PNG que jsPDF escribe como píxeles crudos (256 × 256 × 3 bytes de color + 256 × 256 de transparencia ≈ 0,25 MB por hoja). El PDF horizontal tiene una hoja por orden de trabajo (OT): una OV de 18 OT pesa ~4,6 MB y, en base64, ~6,1 MB.

Los logs de Vercel (plan Hobby, 1 hora de retención) no muestran ninguna llamada a `imprimir-orden` porque el 413 se corta antes de la función. Las variables `SMTP_*` existen en producción; no se comprobó su valor y **no son la causa de este error**.

## 3. Medición (OV sintética, PDF horizontal multipágina)

49 renglones por hoja, un QR distinto por hoja. Medido con vitest fuera del repo.

| Hojas (OT) | Sin comprimir | Comprimido | Base64 sin comprimir | Base64 comprimido |
|---|---|---|---|---|
| 1 | 0,26 MB | 0,01 MB | 0,34 MB | 0,02 MB |
| 9 | 2,30 MB | 0,09 MB | 3,07 MB | 0,11 MB |
| **18** | **4,61 MB** | **0,17 MB** | **6,14 MB** | **0,23 MB** |
| 40 | 10,23 MB | 0,38 MB | 13,65 MB | 0,50 MB |

Límites de la medición: datos inventados (el texto real comprime algo menos, aunque la diferencia es de órdenes de magnitud) y no se midió el PDF vertical de una hoja ni la OV real.

## 4. Solución propuesta (principal): `compress: true`

Agregar `compress: true` al objeto de opciones de los tres constructores:

| Archivo | Línea | Función |
|---|---|---|
| `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts` | 544 | `buildOrdenTareaAlmacenLandscapePdf` (una hoja) |
| `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts` | 560 | `buildOrdenTareaAlmacenLandscapePdfMulti` (multipágina; el que usa la impresión de la OV) |
| `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts` | 346 | PDF vertical de una hoja |

```diff
   const doc = new jsPDF({
     orientation: "portrait",
     unit: "mm",
     format: [PAGE_W, PAGE_H],
+    compress: true,
   });
```

**Qué hace.** Aplica compresión Flate (la misma de `.zip` y `.gz`) a cada flujo interno del PDF, sobre todo el contenido de página y las imágenes. No es un `.zip`: el adjunto sigue siendo un `.pdf` normal y el lector lo descomprime solo. La estructura (diccionarios, tabla de referencias) queda en texto y es pequeña.

**Por qué es la opción principal.** Ataca la causa, mantiene un solo correo por impresión (orden de hojas garantizado, un solo estado de éxito o fallo), no toca el servidor ni el modelo de marcas `impresion_correo_no_enviada`, y se revierte quitando una línea por constructor.

**Riesgo pendiente.** No está comprobado que la impresora o su servicio de correo acepten el PDF comprimido. Es el estándar y casi todos los PDF lo usan, pero hay que verlo con la impresora real.

### Plan de prueba antes del PR

1. Aplicar el cambio en la rama del ticket.
2. Generar el PDF comprimido de la OV real (la de 4,5 MB) y registrar su peso antes y después.
3. Imprimirlo **una vez** en la impresora real y compararlo con la versión sin comprimir.
4. Imprimir también un PDF vertical de una hoja (el otro generador).
5. Agregar una prueba automatizada que genere una OV de 18+ hojas y verifique que el base64 queda bajo el límite (por ejemplo, < 2 MB) con margen.

Si la impresora rechaza el PDF comprimido: descartar la compresión y pasar a la sección 5.

## 5. Respaldo: enviar en varios correos cuando el PDF pese más de ~3 MB

Solo si, después de comprimir, aparece una OV que aún no cabe, o si la impresora no acepta el PDF comprimido.

**Dónde se divide.** En el navegador. El límite de 4,5 MB es de la petición hacia Vercel, no del correo, así que el servidor no cambia: cada petición a `imprimir-orden` ya manda un correo.

**Cómo.**
- Partir las hojas (`sheets`) en grupos y generar un PDF por grupo con `buildOrdenTareaAlmacenLandscapePdfMulti`, midiendo el tamaño al generar. Un grupo se cierra cuando el PDF supera ~3 MB (≈4 MB en base64, bajo el límite de Vercel).
- Cada grupo se envía como una petición, con `jobName` tipo `OV 123 (1/3)`.
- Una hoja que sola supere el límite no se puede dividir; se muestra un error claro.

**Riesgos que hay que resolver antes de adoptarlo.**
1. **Fallo parcial.** Si salen 2 de 3 correos y falla el tercero, un reintento duplicaría las hojas ya impresas. Hay que reintentar solo los grupos fallidos. Hoy `impresion_correo_no_enviada` es una sola marca por OV (`print-correo-fallo.ts`), así que habría que cambiar ese modelo.
2. **Orden de impresión.** Los correos se procesan por separado y pueden mezclarse con otros trabajos.
3. **Límites del proveedor SMTP.** Varios envíos seguidos pueden toparse con límites por minuto.
4. **Más superficie de código.** Toca generación, envío, errores, marcas y pruebas, frente a una línea por constructor de la opción principal.

## 6. Alternativa descartada por ahora: subir el PDF a almacenamiento

Subir el PDF a un almacenamiento y que el servidor lo adjunte. Quita el límite de raíz con un solo correo, pero agrega una pieza de infraestructura nueva. Se retoma solo si las secciones 4 y 5 no alcanzan.

## 7. Mejoras opcionales relacionadas

- `print-silent-cuenta.ts`: si la respuesta es **413**, mostrar «El PDF es demasiado grande para enviarlo por correo» en lugar del mensaje genérico.
- `src/app/api/ventas/imprimir-orden/route.ts` (fuera de la zona de Mauro): agregar `console.error` con el mensaje del error en el `catch` del envío por correo. No arregla el 413, pero deja rastro de los fallos de SMTP que aparezcan después.

## 8. Estado del trabajo y siguiente paso

- Sheet: REQ-186 en `En Progreso`, asignado a Dani.
- Rama local creada: `dani/req-186-comprimir-pdf-impresion` (desde `origin/main`), sin reclamo y sin cambios.
- Reclamo bloqueado: `paralelo.js reclamar` choca con REQ-058 (`mauro/req-058-flujo-estados-orden`, zona `src/modules/sales/ordenes/`). Mauro debe liberar o acotar su reclamo (sin incluir `ordenes/print/`) y publicar la rama.
- Cuando se libere: `importar-claims`, `reclamar` con las zonas `ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts`, `ordenes/print/render-orden-tarea-almacen-pdf.ts` y la prueba nueva (más `print-silent-cuenta.ts` si se incluye el mensaje del 413).
- Relacionado: REQ-179 («OT» → «Tareas», «OCC» → «Orden de compra») también vive en `ordenes/print/`; conviene reclamarlo junto.
