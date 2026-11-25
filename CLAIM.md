<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-419
**Rama:** lucho/req-419-borrar-ov-solo-por-confirmar
**Responsable:** Lucho
**Confianza:** 85%

### Zonas que voy a tocar
- `src/modules/sales/shared/constants/sales-status.ts`
- `src/modules/sales/shared/constants/sales-status.test.ts`
- `src/modules/sales/shared/services/sales-orden-venta-estado.service.ts`
- `src/modules/sales/shared/services/borrar-orden-venta-req350.test.ts`
- `src/modules/sales/shared/services/sales.service.part-f.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerFooter.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerFooter.test.tsx`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Dejar habilitado el botón Borrar únicamente en por_confirmar y deshabilitado (visible) en confirmada, alistamiento y posteriores
