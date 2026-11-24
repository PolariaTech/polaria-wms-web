<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** SCORE-10
**Rama:** dani/score-10-p0
**Responsable:** dani
**Confianza:** 75%

### Zonas que voy a tocar
- `.github/workflows/ci.yml`
- `package.json`
- `src/modules/processing/shared/services/processing.service.ts`
- `src/modules/sales/shared/services/sales-api.service.ts`
- `src/modules/sales/ordenes/surtido/procesar-captura-foto.ts`
- `src/modules/sales/ordenes/surtido/guardar-folio-factura-captura.client.ts`
- `src/modules/sales/ordenes/components/modals/EntregaMapaModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerContent.tsx`
- `src/modules/sales/ordenes/components/modals/use-orden-venta-cypher-drawer-content.ts`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenCamera.tsx`
- `src/modules/sales/correos/components/CorreosFiltros.tsx`
- `src/modules/sales/correos/components/CorreosTable.tsx`
- `src/modules/sales/correos/services/correos.client.ts`
- `src/modules/sales/correos/types/correos.types.ts`
- `src/modules/sales/ordenes/ai/file-extractors.ts`
- `src/modules/sales/ordenes/print-batch/excel-a-pdf.ts`
- `src/modules/admin-panel/catalogo/utils/catalogo-excel-import.ts`
- `src/modules/sales/ordenes/despacho/despacho-publico.service.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/despacho/despacho-publico.service.test.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/despacho/despacho-publico.test.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/shared/services/sales-catalog.api.ts` — autorizada por el usuario el 2026-11-24

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/shared/services/sales-api.service.test.ts`
- `src/modules/sales/ordenes/surtido/procesar-captura-foto.test.ts`
- `src/modules/sales/ordenes/print-batch/excel-a-pdf.test.ts`

### Por qué
Score-10 P1: listado OV sin fallback, audit/Trivy, xlsx→exceljs
