<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-276
**Rama:** lucho/req-276-lote-ui-ov-correo
**Responsable:** Lucho
**Confianza:** 75%

### Zonas que voy a tocar
- `src/app/(shell)/dashboard/(operacion-cuenta)/ventas/correos-mateo/page.tsx`
- `src/modules/sales/correos/components/VentasSidebar.tsx`
- `src/modules/sales/correos/components/VentasSidebar.test.tsx`
- `src/components/shared/module/OperationalModuleShell.test.tsx`
- `src/config/routes.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.req-257.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.req-259.test.tsx`
- `src/modules/sales/ordenes/components/modals/orden-campos-datos-pedido.ts`
- `src/modules/sales/ordenes/components/modals/orden-campos-datos-pedido.test.ts`
- `src/modules/sales/ordenes/components/modals/NotasGeneralesPedidoField.tsx`
- `src/modules/sales/ordenes/components/modals/NotasGeneralesPedidoField.test.tsx`
- `src/modules/sales/ordenes/components/modals/DireccionEntregaField.tsx`
- `src/modules/sales/ordenes/components/modals/DireccionEntregaField.test.tsx`
- `src/modules/sales/ordenes/utils/pedido/dia-semana-entrega.ts`
- `src/modules/sales/ordenes/utils/pedido/dia-semana-entrega.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePreview.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDiscrepanciasDialog.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormFooterIconActions.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormFooterIconActions.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormFooterCenter.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.ts`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.test.ts`
- `src/modules/sales/ordenes/components/modals/cypher-drawer-message.ts`
- `src/modules/sales/ordenes/components/modals/cypher-drawer-message.test.ts`
- `src/modules/sales/ordenes/components/modals/CypherRecepcionCorreoStage.tsx`
- `src/modules/sales/ordenes/surtido/guardar-folio-factura-captura.client.ts`
- `src/modules/sales/ordenes/surtido/folio-factura-captura.test.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts`
- `src/modules/sales/ordenes/utils/origen/texto-origen-pedido.ts`
- `src/modules/sales/ordenes/utils/origen/texto-origen-pedido.test.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/campos-faltantes-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/campos-faltantes-ov.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.test.ts`
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.ts`
- `src/modules/sales/ordenes/utils/ot/confirm-bloqueo-ov.ts`
- `src/modules/sales/ordenes/utils/ot/confirm-bloqueo-ov.test.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.test.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.test.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts`
- `src/modules/sales/ordenes/hooks/useOtOv.ts`
- `src/modules/sales/ordenes/hooks/useOtOv.test.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.test.ts`
- `src/modules/sales/ordenes/types/orden-venta-form-estado.ts`
- `src/modules/sales/ordenes/types/orden-venta-create-modal.types.ts`
- `src/components/shared/form/PolariaFormModal.tsx`
- `src/components/shared/form/PolariaFormModal.test.tsx`
- `src/components/shared/form/PolariaFormModalFooter.tsx`
- `src/components/shared/form/PolariaFormModalFooter.test.tsx`
- `src/components/shared/form/polaria-form-modal-props.ts`

### Compartidos (cambio mínimo y aviso)
- `CHANGELOG.md`
- `schemas/schema_editar_pedido.md`
- `src/modules/sales/README.md`

### Por qué
Lote Lucho REQ-276/277/278/279/285/286/289: correos procesados, notas, layout entrega/moneda, alerta total, OPCIONAL, mensaje raro, CANCELAR→SALIR.
