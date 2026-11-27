<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-432
**Rama:** lucho/req-432-conteos-filtro-fecha-impresion
**Responsable:** Lucho
**Confianza:** 85%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/print-batch/batch-seleccion.ts`
- `src/modules/sales/ordenes/print-batch/batch-seleccion.test.ts`
- `src/modules/sales/ordenes/print-batch/ImpresionBatchPageContent.tsx`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Los totales de Estado de impresión se calculan sobre todas las OV y no respetan el filtro de fecha de entrega
