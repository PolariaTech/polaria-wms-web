<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-223
**Rama:** lucho/req-223-lote-revision-ov
**Responsable:** Lucho
**Confianza:** 55%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawer.tsx`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoChipSelector.tsx` — archivo nuevo
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoChipSelector.test.tsx` — archivo nuevo
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.ts`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.test.ts`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`
- `src/modules/sales/ordenes/components/orden-trabajo/OrdenTrabajoPager.tsx`
- `src/modules/sales/ordenes/utils/ot/ot-pager-required.ts`
- `src/modules/sales/ordenes/utils/ot/ot-pager-required.test.ts`
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts`
- `src/modules/sales/ordenes/print/build-orden-tarea-almacen-html.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.types.ts`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.ts`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.test.ts`
- `src/modules/sales/ordenes/print/render-orden-pdf-size.test.ts`
- `src/app/api/ventas/imprimir-orden/route.ts`
- `src/modules/sales/ordenes/utils/ot/filter-lineas-by-orden-trabajo.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleProductos.tsx`
- `src/app/captura-orden/[idOrdenVenta]/page.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenView.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenCamera.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenUploadForm.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenUploadForm.test.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenCard.tsx`
- `src/app/captura-orden/[idOrdenVenta]/api/route.ts`
- `src/app/captura-orden/[idOrdenVenta]/captura-orden.types.ts`
- `src/modules/sales/ordenes/surtido/compute-estado-alistamiento.ts`
- `src/modules/sales/ordenes/surtido/compute-estado-alistamiento.test.ts`
- `src/modules/sales/ordenes/surtido/orden-surtido.service.ts`
- `src/modules/sales/ordenes/surtido/orden-surtido.types.ts`
- `src/modules/sales/ordenes/components/modals/CypherAlistamientoSection.tsx`
- `src/modules/sales/ordenes/components/modals/CypherAlistadoSection.tsx`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Lote En Revisión (sin 170 ni 219): REQ-223 iconos OT, REQ-229 ID OV-OT, REQ-221 volver a detalle, REQ-176 print vs Polaria, REQ-200 Mateo mes/año (API), REQ-244 OC mensuales SEADUST/KRYSTAL (API), REQ-233 pager sin bloqueo, REQ-243 check-in despacho. Sin CreateModal (POL-400).
