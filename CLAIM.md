<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-429
**Rama:** lucho/req-429-especificaciones-confirmacion
**Responsable:** Lucho
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx`
- `src/modules/sales/ordenes/hooks/use-orden-venta-detalle-ot.test.ts`
- `VERSION` — autorizada por el usuario el 2026-11-26
- `package.json` — autorizada por el usuario el 2026-11-26
- `package-lock.json` — autorizada por el usuario el 2026-11-26

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Bug REQ-429: la vista de confirmacion no muestra especificaciones porque OrdenVentaDetalleModal descarta origen_correo cuando llega como arreglo (jsonb), desde f1dbc54.
