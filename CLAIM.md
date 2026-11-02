<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-212
**Rama:** mauro/req-212-quitar-recuadros-detalle
**Responsable:** Mauro
**Confianza:** 70%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx#DetalleContent`
- `src/modules/sales/ordenes/components/modals/OrdenVentaDetalleModal.tsx#OrdenVentaDetalleModal`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
REQ-212: quitar del detalle los recuadros de orden de trabajo y de origen, dejar la referencia de pedido en los datos, y mostrar los campos de la edicion que faltan (codigo, denominacion, folio, descuento y totales sin IVA).
