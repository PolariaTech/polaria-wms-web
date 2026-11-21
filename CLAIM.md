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

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Pedidos grandes mal leídos por Mateo: match/falsos positivos, totales y orden de productos
