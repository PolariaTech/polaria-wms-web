<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-158
**Rama:** mauro/req-158-maduracion-especificacion-correo
**Responsable:** Mauro
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/pedido/piezas-aprox-kg.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/piezas-aprox-kg.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts#extraerPedido`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts#buildPedidoExtraidoFromOrigenCorreo`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts#buildMaterializeOvDesdeOrigenPlan`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
REQ-158: si el correo dice 3 piezas aprox 5.4 kg, la cantidad queda en kilos y la especificación en piezas.
