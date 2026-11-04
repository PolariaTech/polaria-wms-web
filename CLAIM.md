<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-180
**Rama:** lucho/req-180-lote-revision-ov
**Responsable:** Lucho
**Confianza:** 45%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormFooterCenter.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleProductos.tsx`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.ts`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawer.tsx`
- `src/modules/sales/ordenes/components/modals/CypherAlistamientoSection.tsx`
- `src/modules/sales/ordenes/components/modals/CypherAlistadoSection.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFotosCapturaModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaPdfPreviewModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaReagruparOtModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaReagruparOtModal.test.tsx`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`
- `src/modules/sales/ordenes/components/pages/cliente-listado-cell.tsx`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoChipSelector.tsx`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoChipSelector.test.tsx`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoPager.tsx`
- `src/modules/sales/ordenes/utils/ot/ot-pager-required.ts`
- `src/modules/sales/ordenes/utils/ot/ot-pager-required.test.ts`
- `src/modules/sales/ordenes/utils/ot/filter-lineas-by-orden-trabajo.ts`
- `src/modules/sales/ordenes/utils/ot/confirm-bloqueo-ov.ts`
- `src/modules/sales/ordenes/utils/ot/confirm-bloqueo-ov.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/build-orden-venta-captura-observaciones.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/origen/eml-attachments.ts`
- `src/modules/sales/ordenes/utils/origen/eml-attachments.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjunto-content-type.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjunto-content-type.test.ts`
- `src/modules/sales/ordenes/utils/origen/texto-origen-pedido.ts`
- `src/modules/sales/ordenes/utils/display/orden-venta-display.ts`
- `src/modules/sales/ordenes/surtido/orden-surtido.service.ts`
- `src/modules/sales/ordenes/surtido/orden-surtido.types.ts`
- `src/modules/sales/ordenes/surtido/compute-estado-alistamiento.ts`
- `src/modules/sales/ordenes/surtido/compute-estado-alistamiento.test.ts`
- `src/modules/sales/ordenes/surtido/list-orden-surtido-capturas.client.ts`
- `src/modules/sales/ordenes/surtido/sync-surtido-to-orden-venta.ts`
- `src/modules/sales/ordenes/surtido/sync-surtido-to-orden-venta.test.ts`
- `src/modules/sales/ordenes/surtido/openai-surtido.client.ts`
- `src/modules/sales/ordenes/surtido/openai-surtido.client.test.ts`
- `src/app/captura-orden/[idOrdenVenta]/page.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenView.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenCamera.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenUploadForm.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenUploadForm.test.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenCard.tsx`
- `src/app/captura-orden/[idOrdenVenta]/api/route.ts`
- `src/app/captura-orden/[idOrdenVenta]/captura-orden.types.ts`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.ts`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.test.ts`
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.types.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts`
- `src/modules/sales/ordenes/print/build-orden-tarea-almacen-html.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-pdf-size.test.ts`
- `src/modules/sales/ordenes/print/download-orden-tarea-almacen-pdf.ts`
- `src/app/api/ventas/imprimir-orden/route.ts`
- `src/components/mateo/MateoWidgetHost.tsx`
- `src/components/mateo/MateoWidgetHost.test.tsx`
- `src/modules/sales/shared/types/sales.types.ts`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/shared/services/sales-api.service.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Lote En Revisión (sin REQ-170): 180/197/199/201/207/215-217/220/224/226/227/232/238/252-254/260/262/264/269. UI edición, Mateo, fotos, print batch, multi-OT.
