<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-231
**Rama:** dani/req-231-correos-adp-lectura
**Responsable:** Dani
**Confianza:** 65%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/pedido/piezas-aprox-kg.ts`
- `src/modules/sales/ordenes/utils/pedido/piezas-aprox-kg.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cantidad-envase.ts#extractMadurezEspecificacion`
- `src/modules/sales/ordenes/utils/pedido/resolve-cantidad-envase.ts#resolveEspecificacionPedidoLinea`
- `src/modules/sales/ordenes/utils/pedido/resolve-cantidad-envase.test.ts`
- `src/modules/sales/ordenes/utils/pedido/madurez-linea.ts`
- `src/modules/sales/ordenes/utils/pedido/madurez-linea.test.ts`
- `src/modules/sales/ordenes/utils/match/find-closest-producto-catalogo.ts#tokensNearlyEqual`
- `src/modules/sales/ordenes/utils/match/find-closest-producto-catalogo.test.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Lectura de correos ADP en el front: regex de piezas con paréntesis, colores del nombre como especificación, typo de calibres 200g/260g y lectura de Obs.; la dirección (punto 1) aún sin causa confirmada
