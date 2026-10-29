<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-192
**Rama:** mauro/req-192-especificacion-vista-impresion
**Responsable:** Mauro
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts#mapLineasPrint`
- `src/modules/sales/ordenes/print/orden-tarea-almacen.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx#DetalleContent`
- `src/modules/sales/ordenes/components/modals/CypherAlistamientoSection.tsx#CypherAlistamientoSection`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
REQ-192 y REQ-185: vista, alistamiento e impresion leen la especificacion por nombre y cantidad, y el guardado la deja por id de producto.
