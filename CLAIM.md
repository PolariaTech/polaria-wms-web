<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-347
**Rama:** lucho/lote-ventas-bugs-mejoras
**Responsable:** Lucho
**Confianza:** 72%

### Zonas que voy a tocar
- `src/modules/sales/shared/services/ovs-del-mismo-correo.ts`
- `src/modules/sales/shared/services/ovs-del-mismo-correo.test.ts`
- `src/modules/sales/ordenes/components/modals/use-ovs-del-mismo-correo.ts`
- `src/modules/sales/ordenes/components/modals/use-ovs-del-mismo-correo.test.ts`
- `src/modules/sales/ordenes/components/modals/CypherRecepcionCorreoStage.tsx`
- `src/modules/sales/ordenes/components/modals/CypherRecepcionCorreoStage.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherStagesBody.tsx`
- `src/modules/sales/ordenes/components/modals/orden-venta-cypher-stages-body.types.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerContent.tsx`
- `src/modules/sales/ordenes/utils/match/annotate-correo-partido-ov.ts`
- `src/modules/sales/shared/constants/sales-status.ts`
- `src/modules/sales/shared/constants/sales-status.test.ts`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/shared/services/sales-api.service.ts`
- `src/modules/sales/ordenes/components/modals/use-orden-venta-cypher-drawer-content.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerFooter.tsx`
- `src/modules/sales/index.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Aviso correo partido fiable (347) y cancelar OV confirmada (350) en el lote PR
