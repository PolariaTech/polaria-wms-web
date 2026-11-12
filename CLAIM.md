<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-309
**Rama:** dani/req-309-solicitado-especificacion
**Responsable:** Dani
**Confianza:** 65%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/display/resolve-sku-visible.ts`
- `src/modules/sales/ordenes/utils/display/resolve-sku-visible.test.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/apply-verificaciones-origen-lineas.ts`
- `src/modules/sales/ordenes/utils/pedido/apply-verificaciones-origen-lineas.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.test.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-especificacion-pedido-linea.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-especificacion-pedido-linea.test.ts`
- `src/modules/sales/ordenes/utils/pedido/especificacion-madurez-domo.ts`
- `src/modules/sales/ordenes/utils/pedido/especificacion-madurez-domo.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Lote 1 de precisión de Mateo (REQ-309 y REQ-287): Solicitado sin cruzar renglones al reabrir, sin duplicar ni perder renglones, y especificación leída por el modelo visible en la OV
