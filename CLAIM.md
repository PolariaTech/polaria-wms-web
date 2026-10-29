<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-158
**Rama:** mauro/req-158-maduracion-especificacion-correo
**Responsable:** Mauro
**Confianza:** 60%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/pedido/madurez-linea.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/madurez-linea.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/resolve-cantidad-envase.ts#extractMadurezEspecificacion`
- `src/modules/sales/ordenes/utils/pedido/resolve-cantidad-envase.ts#resolveEspecificacionPedidoLinea`
- `src/modules/sales/ordenes/utils/pedido/resolve-cantidad-envase.test.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts#buildPedidoExtraidoFromOrigenCorreo`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts#buildMaterializeOvDesdeOrigenPlan`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.test.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts#extraerPedido`
- `src/modules/sales/shared/services/sales.service.ts#materializeOrdenVentaDesdeOrigenSiVacia`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
REQ-158: copiar el nivel de maduración de cada renglón del correo de Aguacates de Puebla a la especificación, no solo cuando la palabra ya viene en el nombre del producto.
