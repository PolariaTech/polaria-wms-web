<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-363
**Rama:** lucho/req-363-cliente-denominacion
**Responsable:** Lucho
**Confianza:** 82%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureForm.tsx`
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.ts`
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.test.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.test.ts`
- `src/modules/admin-panel/compradores/services/patch-comprador-denominacion-override.ts`
- `src/modules/admin-panel/compradores/services/patch-comprador-denominacion-override.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-denominacion-comercial.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-denominacion-comercial.test.ts`
- `src/modules/sales/ordenes/utils/pedido/armar-payload-envio-con-sello.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-especificacion-pedido-linea.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-especificacion-pedido-linea.test.ts`
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts` — autorizada por el usuario el 2026-11-19
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts` — autorizada por el usuario el 2026-11-19
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.test.ts` — autorizada por el usuario el 2026-11-19
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts` — autorizada por el usuario el 2026-11-19

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
REQ-363 cliente, denominacion OV, unidad y especificaciones
