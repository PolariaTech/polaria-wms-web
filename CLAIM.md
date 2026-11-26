<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-371
**Rama:** lucho/req-371-alerta-total-ov
**Responsable:** Lucho
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleProductos.tsx`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Resaltar el total de la OV con tooltip cuando no coincide con el total de la OC; la alerta de REQ-279 solo avisa al guardar.
