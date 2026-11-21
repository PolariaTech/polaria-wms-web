<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-380
**Rama:** lucho/req-380-unidad-catalogo-captura
**Responsable:** Lucho
**Confianza:** 88%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/pedido/resolve-unidad-pedido-linea.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-unidad-pedido-linea.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.unidad.test.ts`
- `src/modules/sales/ordenes/utils/pedido/linea-sembrada-desde-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/linea-sembrada-desde-origen.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.unidad.test.ts`
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.ts`
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx`
- `src/modules/sales/ordenes/utils/pedido/resolve-especificacion-pedido-linea.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-especificacion-pedido-linea.test.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Mateo impone unidad del pedido fuera de catálogo y la UI no deja corregirla
