<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-420
**Rama:** lucho/req-420-fecha-llegada-correo
**Responsable:** Lucho
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/shared/services/sales-orden-venta-detalle.service.ts`
- `src/modules/sales/shared/types/sales.types.ts`
- `src/modules/sales/ordenes/components/modals/use-orden-venta-cypher-drawer-content.ts`
- `src/modules/sales/ordenes/components/modals/CypherRecepcionCorreoStage.tsx`
- `src/modules/sales/ordenes/components/modals/CypherRecepcionCorreoStage.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerChrome.tsx`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
La LLEGADA de la OV muestra la fecha de creacion de la OV en lugar de la fecha en que llego el correo (correo_pedido_entrada.recibido_en)
