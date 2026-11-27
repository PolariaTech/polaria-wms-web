<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-428
**Rama:** lucho/req-428-resaltar-campos-vacios
**Responsable:** Lucho
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.ts`
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormProgramacion.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx`
- `src/modules/sales/ordenes/surtido/guardar-folio-factura-captura.client.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Los campos vacíos de cliente y entrega en el formulario de la OV no se resaltan: solo se marcan los que Mateo detectó al leer el correo
