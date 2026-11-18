<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-344
**Rama:** lucho/req-344-centros-consumo-por-ot
**Responsable:** Lucho
**Confianza:** 85%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.ts`
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.test.ts`
- `src/modules/sales/ordenes/utils/pedido/sellar-edicion-usuario-origen.limites.test.ts`
- `src/modules/sales/ordenes/hooks/aplicar-cabecera-con-sello-usuario.ts`
- `src/modules/sales/ordenes/hooks/aplicar-cabecera-con-sello-usuario.test.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts`
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts`
- `src/modules/sales/ordenes/print/resolve-cabecera-print-desde-detalle.ts`
- `src/modules/sales/ordenes/print/resolve-cabecera-print-desde-detalle.test.ts`
- `src/modules/sales/ordenes/utils/pedido/armar-payload-envio-con-sello.ts`
- `src/modules/sales/ordenes/utils/pedido/armar-payload-envio-con-sello.test.ts`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.ts`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.test.ts`
- `package.json` — autorizada por el usuario el 2026-11-18

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
El sello de cabecera OV pisa Almacen de todas las OT al cargar; print usa centro OV
