<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-196
**Rama:** mauro/req-196-rotulo-documentacion-impresion
**Responsable:** Mauro
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/print/build-orden-tarea-almacen-html.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts#buildOrdenTareaAlmacenPdf`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts#drawOrdenTareaAlmacenLandscapePage`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts`
- `src/modules/sales/ordenes/surtido/openai-surtido.client.ts#sanitizeFacturaAsociada`
- `src/modules/sales/ordenes/surtido/openai-surtido.client.ts#sanitizeFacturaOkFolioFirma`
- `src/modules/sales/ordenes/surtido/openai-surtido.client.ts#extraerSurtidoDesdeFoto`
- `src/modules/sales/ordenes/surtido/openai-surtido.client.test.ts`
- `src/modules/sales/ordenes/surtido/compute-estado-alistamiento.ts#capturaTieneFactura`
- `src/modules/sales/ordenes/surtido/compute-estado-alistamiento.test.ts`
- `src/modules/sales/ordenes/surtido/sync-surtido-to-orden-venta.ts#buildSurtidoNotasAlmacen`
- `src/modules/sales/ordenes/surtido/sync-surtido-to-orden-venta.test.ts`
- `src/modules/sales/ordenes/surtido/estimate-surtido-precision.ts`
- `src/modules/sales/ordenes/components/modals/CypherAlistamientoSection.tsx#CypherAlistamientoSection`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawer.tsx#OrdenVentaCypherDrawer`
- `src/modules/sales/ordenes/surtido/apply-surtido-to-print.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
El rotulo impreso Factura (OK) pasa a Documentacion y la lectura acepta los dos.
