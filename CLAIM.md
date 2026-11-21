<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-369
**Rama:** lucho/req-369-lectura-pedidos-grandes
**Responsable:** Lucho
**Confianza:** 70%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/match/find-closest-producto-catalogo.ts`
- `src/modules/sales/ordenes/utils/match/find-closest-producto-catalogo.test.ts`
- `src/modules/sales/ordenes/utils/match/find-closest-producto-catalogo.req-311.test.ts`
- `src/modules/sales/ordenes/utils/match/mateo-coincidencia.ts`
- `src/modules/sales/ordenes/utils/match/mateo-coincidencia.test.ts`
- `src/modules/sales/ordenes/utils/match/build-match-producto.ts`
- `src/modules/sales/ordenes/utils/match/build-match-producto.test.ts`
- `src/modules/sales/ordenes/utils/match/codigo-contradice-nombre.ts`
- `src/modules/sales/ordenes/utils/match/codigo-contradice-nombre.test.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.postproceso.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.prompt.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.prompt.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-match.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-match.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ot-contigua.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ot-contigua.test.ts`
- `src/modules/sales/ordenes/utils/pedido/total-solicitud-vs-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/total-solicitud-vs-ov.test.ts`
- `src/modules/sales/ordenes/utils/pedido/avisos-validacion-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/avisos-validacion-ov.test.ts`
- `src/modules/sales/ordenes/ai/__snapshots__/openai-pedido.prompt/extraer.system.txt` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/resolve-unidad-pedido-linea.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/resolve-unidad-pedido-linea.test.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.unidad.test.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/linea-sembrada-desde-origen.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/resolve-especificacion-pedido-linea.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/ot/aplicar-correccion-correo.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/ot/aplicar-correccion-correo.test.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/components/modals/OrdenVentaCorreccionCorreoPanel.tsx` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/components/modals/OrdenVentaCorreccionCorreoPanel.test.tsx` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/services/correccion-correo.client.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.unidad.test.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/linea-sembrada-desde-origen.test.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.test.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/utils/pedido/resolve-especificacion-pedido-linea.test.ts` — autorizada por el usuario el 2026-11-21
- `schemas/schema_editar_pedido.md` — autorizada por el usuario el 2026-11-21

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Pedidos grandes mal leídos por Mateo: match/falsos positivos, totales y orden de productos
