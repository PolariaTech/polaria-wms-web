<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** POL-419
**Rama:** dani/pol-419-asignar-productos-por-equivalencia-del
**Responsable:** sin responsable
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/shared/types/sales.types.ts`
- `src/modules/sales/ordenes/hooks/useClienteOv.ts`
- `src/modules/sales/ordenes/hooks/useClienteOv.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/types/orden-venta-form-estado.ts`
- `src/modules/sales/ordenes/types/orden-venta-create-modal.types.ts`
- `src/modules/sales/ordenes/utils/match/find-closest-producto-catalogo.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.test.ts`
- `src/modules/sales/shared/services/materializar-lineas-desde-origen.ts`
- `src/modules/sales/shared/services/materializar-lineas-desde-origen.test.ts`
- `src/modules/admin-panel/compradores/services/comprador-producto-alias.service.ts`
- `src/modules/admin-panel/compradores/components/CompradorAliasCreateModal.tsx`
- `src/modules/admin-panel/compradores/utils/comprador-precios-import.ts`
- `src/modules/admin-panel/compradores/utils/comprador-precios-excel.ts`
- `src/modules/sales/ordenes/utils/pedido/linea-sembrada-desde-origen.ts`
- `src/modules/sales/ordenes/hooks/useLineasOv.ts`
- `src/modules/sales/ordenes/hooks/useLineasOv.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.test.ts`
- `src/modules/sales/ordenes/utils/match/build-match-producto.ts`
- `src/modules/sales/ordenes/utils/match/build-match-producto.test.ts`
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.ts`
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/familia-ajena.casos-reales.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.test.ts` — autorizada por el usuario el 2026-11-13
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.test.ts` — autorizada por el usuario el 2026-11-13
- `src/modules/sales/ordenes/utils/origen/__snapshots__/materialize-ov-desde-origen.sin-match.test.ts.snap` — autorizada por el usuario el 2026-11-13

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
POL-419 y POL-420 juntos: asignar por frase del cliente y aprender al guardar
