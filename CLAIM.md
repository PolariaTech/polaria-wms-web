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
- `src/modules/sales/ordenes/utils/persist-linea-avance.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/orden-venta-display.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/sanitize-telefono-contacto.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/build-orden-venta-captura-observaciones.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/filter-lineas-by-orden-trabajo.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/pedido-form-validation.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/map-pedido-extraido-to-form.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/extract-entrega-desde-texto.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/empaque-lineas.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/normalize-numero-pedido.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/match-comprador-from-nombre.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/find-closest-producto-catalogo.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/centro-consumo-vs-cliente.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/correo-chrome.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/resolve-cantidad-envase.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/components/modals/CypherAlistadoSection.tsx` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/components/modals/OrdenVentaAdjuntoPreviewModal.tsx` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.tsx` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePickOt.tsx` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePreview.tsx` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.tsx` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/aplicar-correccion-correo-ov.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/editar-lineas-ov.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/sembrar-lineas-desde-origen.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/useOtOv.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/print-batch/ImpresionBatchPageContent.tsx` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/match/match-comprador-from-nombre.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/ot/reagrupacion-modal-estado.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/pedido/aviso-direccion-ov.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/pedido/extract-entrega-desde-texto.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/pedido/normalize-numero-pedido.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/pedido/resolve-cantidad-envase.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/shared/services/materializar-lineas-desde-origen.ts` — autorizada por el usuario el 2026-11-24
- `package-lock.json` — autorizada por el usuario el 2026-11-24
- `src/components/theme/ThemeBootScript.tsx` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/components/modals/use-entrega-mapa.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/aplicar-reagrupacion-ov.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/reset-formulario-ov.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/hooks/validar-envio-ov.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/print/build-orden-tarea-almacen-html.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/utils/pedido/campos-faltantes-ov.ts` — autorizada por el usuario el 2026-11-24
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.test.tsx` — autorizada por el usuario el 2026-11-24

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/shared/services/sales-api.service.test.ts`
- `src/modules/sales/ordenes/surtido/procesar-captura-foto.test.ts`
- `src/modules/sales/ordenes/print-batch/excel-a-pdf.test.ts`

### Por qué
Score-10 P1: listado OV sin fallback, audit/Trivy, xlsx→exceljs
