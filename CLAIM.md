<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-299
**Rama:** dani/req-299-familia-ajena
**Responsable:** Dani
**Confianza:** 90%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/match/find-closest-producto-catalogo.ts`
- `src/modules/sales/ordenes/utils/match/codigo-contradice-nombre.ts`
- `src/modules/sales/ordenes/utils/match/codigo-contradice-nombre.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts`
- `CHANGELOG.md`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Evitar que la busqueda por parecido asigne un producto de otra familia por una palabra calificativa.
