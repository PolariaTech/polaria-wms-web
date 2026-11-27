<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-431
**Rama:** lucho/req-431-detalle-ot-origen
**Responsable:** Lucho
**Confianza:** 70%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/hooks/use-orden-venta-detalle-ot.ts`
- `src/modules/sales/ordenes/hooks/use-orden-venta-detalle-ot.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Detalle de OV no separa productos por OT: el guard typeof origen_correo === string descarta el jsonb ya parseado
