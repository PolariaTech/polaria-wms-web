<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-180
**Rama:** lucho/req-180-lote-bugs-ov
**Responsable:** Lucho
**Confianza:** 70%

### Zonas que voy a tocar
- `docs/REQ-186-IMPRESION-413.md`
- `src/modules/sales/ordenes/components/modals/NotasGeneralesPedidoField.test.tsx`
- `src/modules/sales/ordenes/components/modals/NotasGeneralesPedidoField.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDiscrepanciasDialog.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.tsx`
- `src/modules/sales/ordenes/components/modals/orden-venta-create-modal-cabecera.test.ts`
- `src/modules/sales/ordenes/components/modals/orden-venta-create-modal-cabecera.ts`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`
- `src/modules/sales/ordenes/hooks/aplicar-correccion-correo-ov.ts`
- `src/modules/sales/ordenes/hooks/aplicar-detalle-sin-mateo.test.ts`
- `src/modules/sales/ordenes/hooks/aplicar-detalle-sin-mateo.ts`
- `src/modules/sales/ordenes/hooks/bloqueo-paint-edicion-ov.test.ts`
- `src/modules/sales/ordenes/hooks/bloqueo-paint-edicion-ov.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.req-170.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.test.ts`
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/editar-lineas-ov.ts`
- `src/modules/sales/ordenes/hooks/reset-formulario-ov.test.ts`
- `src/modules/sales/ordenes/hooks/reset-formulario-ov.ts`
- `src/modules/sales/ordenes/hooks/sembrar-lineas-desde-origen.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.test.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts`
- `src/modules/sales/ordenes/hooks/useOtOv.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.test.ts`
- `src/modules/sales/ordenes/hooks/validar-envio-ov.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.client.test.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts`
- `src/modules/sales/ordenes/print/build-orden-tarea-almacen-html.ts`
- `src/modules/sales/ordenes/print/download-orden-tarea-almacen-pdf.test.ts`
- `src/modules/sales/ordenes/print/download-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen-paginacion.test.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.types.ts`
- `src/modules/sales/ordenes/print/paint-print-cell-text.test.ts`
- `src/modules/sales/ordenes/print/render-orden-pdf-size.test.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.test.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.test.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.test.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts`
- `src/modules/sales/ordenes/utils/origen/sanitize-notas-generales-pedido.test.ts`
- `src/modules/sales/ordenes/utils/origen/sanitize-notas-generales-pedido.ts`
- `src/modules/sales/ordenes/utils/origen/texto-origen-pedido.test.ts`
- `src/modules/sales/ordenes/utils/origen/texto-origen-pedido.ts`
- `src/modules/sales/ordenes/utils/pedido/build-orden-venta-captura-observaciones.test.ts`
- `src/modules/sales/ordenes/utils/pedido/build-orden-venta-captura-observaciones.ts`
- `src/modules/sales/ordenes/utils/pedido/centro-consumo-vs-cliente.test.ts`
- `src/modules/sales/ordenes/utils/pedido/centro-consumo-vs-cliente.ts`
- `src/modules/sales/ordenes/utils/pedido/empaque-lineas.test.ts`
- `src/modules/sales/ordenes/utils/pedido/empaque-lineas.ts`
- `src/modules/sales/ordenes/utils/pedido/espera-ov.test.ts`
- `src/modules/sales/ordenes/utils/pedido/espera-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/linea-sembrada-desde-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/linea-sembrada-desde-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/madurez-linea.test.ts`
- `src/modules/sales/ordenes/utils/pedido/madurez-linea.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.test.ts`
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.ts`
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.test.ts`
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/quitar-contacto-direccion.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cantidad-envase.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cantidad-envase.ts`
- `src/modules/sales/ordenes/utils/pedido/sanitize-telefono-contacto.test.ts`
- `src/modules/sales/ordenes/utils/pedido/sanitize-telefono-contacto.ts`
- `src/modules/sales/ordenes/print-batch/html-a-pdf.ts` — autorizada por el usuario el 2026-11-10
- `src/modules/sales/ordenes/print-batch/html-a-pdf.test.ts` — autorizada por el usuario el 2026-11-10

### Compartidos (cambio mínimo y aviso)
- `CHANGELOG.md`
- `schemas/schema_editar_pedido.md`
- `src/modules/sales/shared/types/sales.types.ts`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/shared/services/orden-venta-capture-fields.ts`
- `src/modules/sales/ordenes/types/orden-venta-form-estado.ts`
- `src/modules/sales/ordenes/types/orden-venta-create-modal.types.ts`

### Por qué
Lote bugs OV En Revisión: REQ-180 lock edición concurrente; REQ-281 notas/centro/teléfono que reaparecen; REQ-287 Madurez y tamaño domo; REQ-297 escala HTML impresión carta.
