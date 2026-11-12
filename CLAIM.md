<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-032
**Rama:** lucho/req-032-lote-backlog-once
**Responsable:** Lucho
**Confianza:** 76%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.ts`
- `src/modules/sales/ordenes/hooks/aplicar-cabecera-con-sello-usuario.ts`
- `src/modules/sales/ordenes/hooks/aplicar-cabecera-con-sello-usuario.test.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts`
- `src/modules/sales/ordenes/hooks/editar-lineas-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.limites.test.ts`
- `src/modules/sales/ordenes/utils/pedido/armar-payload-envio-con-sello.ts`
- `src/modules/sales/ordenes/utils/pedido/armar-payload-envio-con-sello.test.ts`
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/sanitize-telefono-contacto.ts`
- `src/modules/sales/ordenes/utils/pedido/sanitize-telefono-contacto.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.ts`
- `src/modules/sales/ordenes/utils/origen/sanitize-notas-generales-pedido.ts`
- `src/modules/sales/ordenes/utils/origen/sanitize-notas-generales-pedido.test.ts`
- `src/modules/sales/ordenes/utils/origen/texto-origen-pedido.ts`
- `src/modules/sales/ordenes/utils/origen/texto-origen-pedido.test.ts`
- `src/modules/sales/ordenes/print/resolve-cabecera-print-desde-detalle.ts`
- `src/modules/sales/ordenes/print/resolve-cabecera-print-desde-detalle.test.ts`
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts`
- `src/modules/sales/ordenes/print/build-orden-tarea-almacen-html.ts`
- `src/modules/sales/ordenes/components/modals/NotasGeneralesPedidoField.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/shared/services/materializar-lineas-desde-origen.ts`
- `src/modules/sales/shared/services/orden-venta-capture-fields.ts`
- `src/modules/sales/shared/services/orden-venta-detalle-columns.ts`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/ordenes/components/shared/OrigenAdjuntosCards.tsx`
- `src/modules/sales/ordenes/components/modals/CypherOrigenAdjuntosBlock.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerChrome.tsx`
- `src/modules/sales/ordenes/components/modals/CypherStageAccordion.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormFooterIconActions.tsx`
- `src/modules/sales/ordenes/components/modals/orden-venta-footer-icon-tooltips.ts`
- `src/modules/sales/ordenes/components/modals/AdjuntoPreviewZoomControls.tsx`
- `src/modules/sales/ordenes/constants/cypher-layout.ts`
- `src/modules/sales/ordenes/utils/origen/eml-attachments.ts`
- `src/modules/sales/ordenes/utils/origen/eml-attachments.test.ts`
- `src/modules/sales/ordenes/utils/eml-attachments.ts`
- `src/app/api/ov-adjuntos/eml-parts/route.ts`
- `src/app/api/ov-adjuntos/eml-parts/file/route.ts`
- `src/modules/sales/ordenes/ai/file-extractors.ts`
- `src/modules/sales/ordenes/components/modals/CypherRecepcionCorreoStage.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleProductos.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleProductos.test.tsx`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx`
- `src/constants/brand/brand.ts`
- `src/components/layouts/shell/AppShellLayout.tsx`
- `src/app/layout.tsx`
- `package.json`
- `VERSION`
- `src/modules/sales/ordenes/print/print-correo-fallo.ts`
- `src/stores/shell-overlay.store.ts`
- `src/modules/sales/ordenes/components/modals/cypher-drawer-resize.ts`
- `src/modules/sales/ordenes/components/modals/use-orden-venta-cypher-drawer-content.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerContent.tsx`
- `src/app/globals.css`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureForm.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.tsx`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/origen/correo-chrome.ts`
- `src/modules/sales/ordenes/utils/origen/correo-chrome.test.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.ts`
- `src/modules/sales/ordenes/hooks/aplicar-reagrupacion-ov.ts`
- `src/modules/sales/ordenes/types/orden-venta-create-modal.types.ts` — autorizada por el usuario el 2026-11-12
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.ts` — autorizada por el usuario el 2026-11-12
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.test.ts` — autorizada por el usuario el 2026-11-12
- `src/modules/sales/ordenes/hooks/useOtOv.ts` — autorizada por el usuario el 2026-11-12
- `src/modules/sales/ordenes/hooks/useLineasOv.ts` — autorizada por el usuario el 2026-11-12

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/ordenes/utils/origen/texto-origen-pedido.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.ts`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts`
- `src/modules/sales/ordenes/hooks/aplicar-cabecera-con-sello-usuario.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerChrome.tsx`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`

### Por qué
Lote backlog Sheet: REQ-032,102,132,141,218,281,293,307 (sin 287/309/310; notas/sello, iconos, EML, %desc, versión, Cypher resize)
