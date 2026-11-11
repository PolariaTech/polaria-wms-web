<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-299
**Rama:** dani/req-299-codigo-contradice-nombre
**Responsable:** Dani
**Confianza:** 90%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/linea-sembrada-desde-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/linea-sembrada-desde-origen.test.ts`
- `CHANGELOG.md`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Un SKU de otro producto no debe asignarse si contradice el nombre del cliente
