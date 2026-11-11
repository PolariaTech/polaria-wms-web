<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-304
**Rama:** lucho/req-304-lote-cypher-vista-ov
**Responsable:** Lucho
**Confianza:** 70%

### Zonas que voy a tocar
- `src/components/shared/form/PolariaConfirmDialog.tsx`
- `src/components/shared/form/polaria-form-modal-layout.ts`
- `src/components/shared/form/polaria-form-modal-layout.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePreview.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDiscrepanciasDialog.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerContent.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerDialogs.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaAdjuntoPreviewModal.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaReagruparOtModal.test.tsx`
- `src/modules/sales/ordenes/constants/cypher-layout.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.test.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.test.ts`
- `src/modules/sales/ordenes/types/orden-venta-create-modal.types.ts`
- `src/modules/sales/ordenes/types/orden-venta-form-estado.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.req-259.test.ts`
- `src/modules/sales/ordenes/components/modals/orden-campos-datos-pedido.ts`
- `src/modules/sales/ordenes/components/modals/orden-campos-datos-pedido.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.test.tsx`
- `src/modules/sales/ordenes/components/modals/DireccionEntregaField.tsx`
- `src/modules/sales/ordenes/components/modals/DireccionEntregaField.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.ts`
- `src/modules/sales/shared/types/sales.types.ts`
- `src/modules/sales/shared/services/orden-venta-capture-fields.ts`
- `src/modules/sales/shared/services/orden-venta-capture-fields.test.ts`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.req-170.test.ts`
- `src/modules/sales/ordenes/utils/pedido/campos-faltantes-ov.ts`
- `src/modules/transport/shared/types/transport.types.ts`
- `src/modules/transport/guias/components/TransporteEntregaModal.tsx`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-id-producto-verificado.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts`
- `src/modules/sales/ordenes/utils/pedido/normalize-numero-pedido.ts`
- `src/modules/sales/ordenes/utils/pedido/normalize-numero-pedido.test.ts`
- `src/modules/sales/ordenes/hooks/reset-formulario-ov.ts` — autorizada por el usuario el 2026-11-11
- `package-lock.json` — autorizada por el usuario el 2026-11-11
- `src/modules/sales/ordenes/surtido/estado-fotos/estado-fotos.logic.test.ts` — autorizada por el usuario el 2026-11-11
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts` — autorizada por el usuario el 2026-11-11

### Compartidos (cambio mínimo y aviso)
- `package.json`
- `next.config.ts`
- `.env.example`

### Por qué
Lote REQ-304/305/251/238: Cypher confirm, vista detalle, mapa dirección entrega, OT cocinas Mateo
