<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-104
**Rama:** mauro/req-104-ordenes-duplicadas-seguimiento
**Responsable:** Mauro
**Confianza:** 50%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/match/find-potencial-duplicado-ov.ts`
- `src/modules/sales/ordenes/utils/match/find-potencial-duplicado-ov.test.ts`
- `src/modules/sales/shared/types/sales.types.ts`
- `src/modules/sales/shared/constants/sales-status.ts`
- `src/modules/sales/shared/services/sales.service.ts#listOrdenesVentaOperador`
- `src/modules/sales/shared/services/sales.service.ts#borrarOrdenVenta`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx#OperadorOrdenesVentaPageContent`
- `src/modules/sales/ordenes/seguimiento/tipos-seguimiento.ts` — archivo nuevo
- `src/modules/sales/ordenes/seguimiento/clasificar-seguimiento-orden.ts` — archivo nuevo
- `src/modules/sales/ordenes/seguimiento/clasificar-seguimiento-orden.test.ts` — archivo nuevo

### Compartidos (cambio mínimo y aviso)
- `CHANGELOG.md`

### Por qué
Flujo de ordenes duplicadas y de seguimiento (cambio, queja, reclamo).
