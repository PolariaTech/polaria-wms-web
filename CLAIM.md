<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-425
**Rama:** lucho/req-425-total-formulario-correccion
**Responsable:** Lucho
**Confianza:** 85%

### Zonas que voy a tocar
- `src/app/api/ov-adjuntos/resolve-occ/route.ts`
- `src/app/api/ov-adjuntos/resolve-occ/route.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleContent.tsx`
- `src/modules/sales/ordenes/utils/ot/filter-lineas-by-orden-trabajo.ts`
- `src/modules/sales/ordenes/utils/pedido/renglones-sin-linea.ts`
- `src/modules/sales/ordenes/utils/pedido/renglones-sin-linea.test.ts`
- `src/modules/sales/ordenes/utils/pedido/use-leer-total-desde-adjuntos.ts`
- `src/modules/sales/ordenes/utils/pedido/use-leer-total-desde-adjuntos.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Total OV distinto a la OC: las lineas guardadas se asignaban a la tarea equivocada (codigo del cliente != SKU) y el aviso de total nunca salia (totales calculados despues del aviso y total de otra OC del mismo correo)
