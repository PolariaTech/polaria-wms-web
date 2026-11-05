<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-266
**Rama:** lucho/req-266-preview-oc-cypher
**Responsable:** Lucho
**Confianza:** 55%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawer.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaPdfPreviewModal.tsx`
- `src/modules/sales/ordenes/components/shared/OrigenAdjuntosCards.tsx`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjunto-content-type.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjunto-content-type.test.ts`
- `src/modules/sales/ordenes/components/modals/cypher-etapa-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/components/modals/cypher-etapa-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/components/modals/CypherAlistamientoSection.tsx`
- `src/modules/sales/ordenes/components/modals/CypherAlistadoSection.tsx`
- `src/modules/sales/ordenes/constants/cypher-layout.ts`
- `src/modules/sales/ordenes/constants/cypher-layout.test.ts`
- `src/modules/sales/ordenes/utils/pedido/cypher-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/cypher-ov.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts`
- `src/app/api/ventas/leer-pedido/route.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.req-234.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-build-from-form.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-build-from-form.test.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.test.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupar-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupar-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/utils/ot/filter-lineas-by-orden-trabajo.ts`
- `src/modules/sales/ordenes/utils/ot/filter-lineas-by-orden-trabajo.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/centro-consumo-vs-cliente.ts`
- `src/modules/sales/ordenes/utils/pedido/centro-consumo-vs-cliente.test.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/enrich-almacen-codigo.ts`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoChipSelector.tsx`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoPreviewList.tsx`
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.ts`
- `src/modules/sales/ordenes/hooks/useOtOv.ts`
- `src/modules/sales/ordenes/print/build-orden-tarea-almacen-html.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.types.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts`
- `src/modules/sales/ordenes/print/render-orden-pdf-size.test.ts`
- `src/modules/sales/ordenes/print/resolve-captura-orden-origin.ts`
- `src/modules/sales/ordenes/print/resolve-captura-orden-origin.test.ts`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.ts`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.test.ts`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/shared/services/sales.service.test.ts`
- `src/modules/sales/shared/constants/sales-status.ts`
- `src/modules/sales/shared/constants/sales-status.test.ts`
- `src/modules/sales/shared/types/sales.types.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.req-257.test.tsx`
- `src/components/shared/form/PolariaDateInputDdMm.tsx`
- `src/lib/utils/fecha-dd-mm-yyyy.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.test.ts`
- `src/modules/sales/ordenes/services/ov-adjuntos.client.ts`
- `src/modules/sales/ordenes/surtido/apply-surtido-to-print.ts`
- `src/modules/sales/ordenes/surtido/apply-surtido-to-print.test.ts`
- `src/modules/sales/ordenes/components/pages/cliente-listado-cell.tsx`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Lote Cypher/OT/impresión/fecha: REQ-237,238,246,255,256,266,269 (sin archivos de Dani REQ-264)
