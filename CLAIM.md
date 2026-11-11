<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-295
**Rama:** dani/req-295-296-298-impresion-lote
**Responsable:** Dani
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/print-batch/rapida-seleccion.ts`
- `src/modules/sales/ordenes/print-batch/rapida-seleccion.test.ts`
- `src/modules/sales/ordenes/print-batch/ImpresionRapidaPageContent.tsx`
- `src/modules/sales/ordenes/print-batch/ImpresionRapidaPageContent.test.tsx`
- `src/modules/sales/ordenes/print-batch/ImpresionRapidaPageContent.fecha.test.tsx`
- `src/modules/sales/ordenes/print-batch/ImpresionRapidaPageContent.oc.test.tsx`
- `src/modules/sales/ordenes/print-batch/armar-previa-rapida.ts`
- `src/modules/sales/ordenes/print-batch/armar-previa-rapida.test.ts`
- `src/modules/sales/ordenes/print-batch/resumen-impresion.ts`
- `src/modules/sales/ordenes/print-batch/resumen-impresion.test.ts`
- `src/modules/sales/ordenes/print-batch/ImpresionBatchVistaPrevia.tsx`
- `src/modules/sales/ordenes/print-batch/ImpresionBatchVistaPrevia.test.tsx`
- `src/modules/sales/ordenes/print-batch/ImpresionBatchPageContent.tsx`
- `src/modules/sales/ordenes/print-batch/ImpresionBatchPageContent.test.tsx`
- `src/modules/sales/ordenes/print-batch/batch-seleccion.ts`
- `src/modules/sales/ordenes/print-batch/batch-seleccion.test.ts`
- `src/modules/sales/ordenes/print-batch/ImpresionBatchFiltros.tsx`
- `src/modules/sales/ordenes/print-batch/ImpresionBatchFiltros.test.tsx`
- `src/modules/sales/ordenes/print-batch/enviar-paquete.ts`
- `src/modules/sales/ordenes/print-batch/enviar-paquete.test.ts`
- `src/modules/sales/ordenes/print-batch/utilidades-batch.ts`
- `src/modules/sales/ordenes/print-batch/utilidades-batch.test.ts`
- `src/modules/sales/ordenes/print/render-resumen-impresion-pdf.ts`
- `src/modules/sales/ordenes/print/render-resumen-impresion-pdf.test.ts`
- `src/lib/utils/fecha-dd-mm-yyyy.ts`
- `src/lib/utils/fecha-dd-mm-yyyy.test.ts`
- `src/modules/sales/ordenes/print-batch/ImpresionRapidaTipos.tsx`
- `src/modules/sales/ordenes/print-batch/ImpresionRapidaTipos.test.tsx`
- `src/modules/sales/ordenes/print-batch/ImpresionBatchLista.tsx` — autorizada por el usuario el 2026-11-11
- `src/modules/sales/ordenes/print-batch/ImpresionBatchLista.test.tsx` — autorizada por el usuario el 2026-11-11
- `src/modules/sales/ordenes/print-batch/ya-impresas.ts` — autorizada por el usuario el 2026-11-11
- `src/modules/sales/ordenes/print-batch/ya-impresas.test.ts` — autorizada por el usuario el 2026-11-11

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Lote impresión: REQ-295 fecha exacta en la rápida, REQ-296 resumen y descarga por partes, REQ-298 detallada con OC y filtro de ya impresas
