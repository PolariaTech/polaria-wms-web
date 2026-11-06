<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-266
**Rama:** lucho/req-266-preview-oc-cypher
**Responsable:** Lucho
**Confianza:** 55%

### Zonas que voy a tocar
- `src/app/api/ventas/leer-pedido/route.ts`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenUploadForm.tsx`
- `src/app/captura-orden/[idOrdenVenta]/page.test.tsx`
- `src/components/shared/form/PolariaDateInputDdMm.tsx`
- `src/components/shared/module/OperationalModuleShell.tsx`
- `src/lib/utils/fecha-dd-mm-yyyy.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts`
- `src/modules/sales/ordenes/components/modals/CypherAlistadoSection.tsx`
- `src/modules/sales/ordenes/components/modals/CypherAlistamientoSection.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureForm.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.req-225.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.req-257.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePreview.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawer.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormFooterCenter.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.req-259.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaPdfPreviewModal.tsx`
- `src/modules/sales/ordenes/components/modals/cypher-etapa-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/components/modals/cypher-etapa-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoChipSelector.tsx`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoPreviewList.tsx`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.test.tsx`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`
- `src/modules/sales/ordenes/components/pages/OvEstadoFiltroBar.test.tsx`
- `src/modules/sales/ordenes/components/pages/OvEstadoFiltroBar.tsx`
- `src/modules/sales/ordenes/components/pages/cliente-listado-cell.tsx`
- `src/modules/sales/ordenes/components/pickers/OrdenVentaCompradorPickerModal.tsx`
- `src/modules/sales/ordenes/components/pickers/OrdenVentaProductoPickerModal.tsx`
- `src/modules/sales/ordenes/components/shared/OrigenAdjuntosCards.tsx`
- `src/modules/sales/ordenes/constants/cypher-layout.test.ts`
- `src/modules/sales/ordenes/constants/cypher-layout.ts`
- `src/modules/sales/ordenes/constants/ordenes-venta-table-layout.ts`
- `src/modules/sales/ordenes/hooks/aplicar-correccion-correo-ov.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts`
- `src/modules/sales/ordenes/hooks/editar-lineas-ov.ts`
- `src/modules/sales/ordenes/hooks/sembrar-lineas-desde-origen.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.ts`
- `src/modules/sales/ordenes/hooks/useOtOv.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.ts`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.test.ts`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.ts`
- `src/modules/sales/ordenes/print/build-orden-tarea-almacen-html.ts`
- `src/modules/sales/ordenes/print/download-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.types.ts`
- `src/modules/sales/ordenes/print/render-orden-pdf-size.test.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/resolve-captura-orden-origin.test.ts`
- `src/modules/sales/ordenes/print/resolve-captura-orden-origin.ts`
- `src/modules/sales/ordenes/services/ov-adjuntos.client.ts`
- `src/modules/sales/ordenes/surtido/apply-surtido-to-print.test.ts`
- `src/modules/sales/ordenes/surtido/apply-surtido-to-print.ts`
- `src/modules/sales/ordenes/types/orden-venta-form-estado.ts`
- `src/modules/sales/ordenes/utils/display/orden-venta-tabla-meta.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjunto-content-type.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjunto-content-type.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-build-from-form.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-build-from-form.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.req-234.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.test.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts`
- `src/modules/sales/ordenes/utils/ot/filter-lineas-by-orden-trabajo.test.ts`
- `src/modules/sales/ordenes/utils/ot/filter-lineas-by-orden-trabajo.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupar-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupar-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/pedido/campos-faltantes-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/centro-consumo-vs-cliente.test.ts`
- `src/modules/sales/ordenes/utils/pedido/centro-consumo-vs-cliente.ts`
- `src/modules/sales/ordenes/utils/pedido/cypher-ov.test.ts`
- `src/modules/sales/ordenes/utils/pedido/cypher-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/enrich-almacen-codigo.ts`
- `src/modules/sales/ordenes/utils/pedido/foco-formulario-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/prefill-orden-venta-from-comprador.test.ts`
- `src/modules/sales/ordenes/utils/pedido/prefill-orden-venta-from-comprador.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.ts`
- `src/modules/sales/shared/constants/sales-status.test.ts`
- `src/modules/sales/shared/constants/sales-status.ts`
- `src/modules/sales/shared/services/sales.service.test.ts`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/shared/types/sales.types.ts`
- `next.config.ts` — autorizada por el usuario el 2026-11-06
- `next.config.test.ts` — autorizada por el usuario el 2026-11-06
- `schemas/schema_editar_pedido.md` — autorizada por el usuario el 2026-11-06
- `src/modules/admin-panel/compradores/components/CompradoresListView.test.tsx` — autorizada por el usuario el 2026-11-06
- `src/modules/admin-panel/compradores/services/compradores.service.test.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/admin-panel/compradores/services/compradores.service.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/admin-panel/index.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleIdentidadCliente.tsx` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.test.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/hooks/reset-formulario-ov.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.test.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/utils/match/match-comprador-from-nombre.test.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/utils/pedido/campos-faltantes-ov.test.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/shared/services/orden-venta-capture-fields.test.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/shared/services/orden-venta-capture-fields.ts` — autorizada por el usuario el 2026-11-06

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Lote REQ-228,237,238,241,246,255,256,266,269,271,282
