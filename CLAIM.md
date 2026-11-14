<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-311
**Rama:** lucho/req-311-lote-grabado-fechas
**Responsable:** Lucho
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/hooks/editar-lineas-ov.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-build-from-form.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-build-from-form.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-build-from-form.req-234.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-build-from-form.req-236.test.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.test.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.test.ts`
- `src/modules/sales/ordenes/hooks/aplicar-detalle-sin-mateo.ts`
- `src/modules/sales/ordenes/hooks/aplicar-detalle-sin-mateo.test.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.test.ts`
- `src/modules/sales/ordenes/utils/ot/filter-lineas-by-orden-trabajo.ts`
- `src/modules/sales/ordenes/utils/ot/filter-lineas-by-orden-trabajo.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.ts`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.test.ts`
- `src/modules/sales/ordenes/print/resolve-cabecera-print-desde-detalle.ts`
- `src/modules/sales/ordenes/print/resolve-cabecera-print-desde-detalle.test.ts`
- `src/modules/sales/ordenes/hooks/efectos-formulario-ot.ts`
- `src/modules/sales/ordenes/hooks/efectos-formulario-ot.test.ts`
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.limites.test.ts`
- `src/modules/sales/ordenes/utils/pedido/armar-payload-envio-con-sello.ts`
- `src/modules/sales/ordenes/utils/pedido/armar-payload-envio-con-sello.test.ts`
- `src/lib/utils/fecha-dd-mm-yyyy.ts`
- `src/lib/utils/fecha-dd-mm-yyyy.test.ts`
- `src/components/shared/form/PolariaDateInputDdMm.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.req-257.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleDatosPedidoEntrega.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleDatosPedidoEntrega.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleIdentidadCliente.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleIdentidadCliente.test.tsx`
- `src/modules/sales/ordenes/utils/pedido/build-orden-venta-captura-observaciones.ts`
- `src/modules/sales/ordenes/components/modals/orden-campos-datos-pedido.ts`
- `src/modules/sales/ordenes/components/modals/orden-campos-datos-pedido.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePreview.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePreview.test.tsx`
- `src/modules/sales/ordenes/components/pages/texto-fecha-entrega-listado.ts`
- `src/modules/sales/ordenes/components/pages/texto-fecha-entrega-listado.test.ts`
- `src/modules/sales/ordenes/utils/pedido/dia-semana-entrega.ts`
- `src/modules/sales/ordenes/utils/pedido/dia-semana-entrega.test.ts`
- `schemas/schema_editar_pedido.md`
- `src/modules/sales/ordenes/print-batch/orden-impresion.ts` — autorizada por el usuario el 2026-11-14
- `src/modules/sales/ordenes/utils/pedido/build-orden-venta-captura-observaciones.test.ts` — autorizada por el usuario el 2026-11-14
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts` — autorizada por el usuario el 2026-11-14
- `src/modules/sales/ordenes/print-batch/armar-previa-rapida.test.ts` — autorizada por el usuario el 2026-11-14
- `src/modules/sales/ordenes/print-batch/armar-previa-detallada.test.ts` — autorizada por el usuario el 2026-11-14
- `src/modules/sales/ordenes/print-batch/ImpresionRapidaPageContent.fecha.test.tsx` — autorizada por el usuario el 2026-11-14

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/ordenes/utils/filter-lineas-by-orden-trabajo.ts`

### Por qué
Lote REQ-311 (líneas/notas no grabadas 1ª vez) + REQ-320/321 (formato fecha DD-MMM-AAAA y día como auxiliar)
