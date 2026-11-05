<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-165
**Rama:** lucho/req-165-lote-revision-ov
**Responsable:** Lucho
**Confianza:** 55%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts`
- `src/modules/sales/ordenes/services/sales-ai.api.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/apply-verificaciones-origen-lineas.ts`
- `src/modules/sales/ordenes/utils/pedido/apply-verificaciones-origen-lineas.test.ts`
- `src/modules/sales/ordenes/utils/pedido/pedido-form-validation.ts`
- `src/modules/sales/ordenes/utils/pedido/pedido-form-validation.test.ts`
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/campos-faltantes-ov.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-build-from-form.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-id-producto-verificado.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.test.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.test.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.test.ts`
- `src/modules/sales/ordenes/hooks/useLineasOv.ts`
- `src/modules/sales/ordenes/hooks/editar-lineas-ov.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.ts`
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.ts`
- `src/modules/sales/ordenes/hooks/sembrar-lineas-desde-origen.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleProductos.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawer.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureForm.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.tsx`
- `src/modules/sales/ordenes/components/modals/orden-venta-create-modal-cabecera.ts`
- `src/modules/sales/ordenes/components/modals/CypherAlistamientoSection.tsx`
- `src/modules/sales/ordenes/components/modals/CypherAlistadoSection.tsx`
- `src/modules/sales/ordenes/components/modals/CypherDatosFiscalesSection.tsx`
- `src/modules/sales/ordenes/components/modals/CypherClienteVsMateoSection.tsx`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoChipSelector.tsx`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.test.tsx`
- `src/modules/sales/ordenes/components/pages/texto-fecha-entrega-listado.ts`
- `src/modules/sales/ordenes/components/pages/texto-fecha-entrega-listado.test.ts`
- `src/modules/sales/ordenes/print/download-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts`
- `src/modules/sales/ordenes/print/build-orden-tarea-almacen-html.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/shared/services/sales.service.test.ts`
- `src/modules/sales/shared/types/sales.types.ts`
- `src/modules/sales/shared/constants/sales-status.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts` — autorizada por el usuario el 2026-11-05

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/index.ts`

### Por qué
Lote En Revisión Lucho (REQ-165/170/214/225/234-237/240/248/257/259); excluye lote REQ-199 entregado
