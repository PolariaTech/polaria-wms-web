<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-370
**Rama:** lucho/req-370-mantener-orden-productos
**Responsable:** Lucho
**Confianza:** 55%

### Zonas que voy a tocar
- `src/modules/sales/shared/services/sales-create-orden-venta-persist.ts`
- `src/modules/sales/shared/services/sales-create-orden-venta-persist.test.ts`
- `src/modules/sales/shared/services/materializar-lineas-desde-origen.ts`
- `src/modules/sales/shared/services/materializar-lineas-desde-origen.test.ts`
- `src/modules/sales/shared/services/sales-orden-venta.db.ts`
- `src/modules/sales/shared/services/sales-orden-venta.db.test.ts`
- `src/modules/sales/shared/services/sales-orden-venta-detalle.service.ts`
- `src/modules/sales/shared/services/sales-orden-venta-detalle.service.test.ts`
- `src/modules/sales/shared/services/sales.service.part-b.test.ts` — autorizada por el usuario el 2026-11-26

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/shared/types/sales.types.ts`

### Por qué
REQ-370 pide que las líneas de la OV sigan el orden de la OC. La web inserta las líneas en bloque (sales-create-orden-venta-persist, materializar-lineas-desde-origen) y las lee de Supabase sin orden (sales-orden-venta.db, sales-orden-venta-detalle.service); la tabla no guarda posición. Confianza media: falta decidir la columna de posición.
