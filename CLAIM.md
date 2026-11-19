<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-363
**Rama:** lucho/req-363-cliente-denominacion
**Responsable:** Lucho
**Confianza:** 82%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureForm.tsx`
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.ts`
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.test.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts`
- `src/modules/sales/ordenes/hooks/useEnvioOv.test.ts`
- `src/modules/admin-panel/compradores/services/patch-comprador-denominacion-override.ts`
- `src/modules/admin-panel/compradores/services/patch-comprador-denominacion-override.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-denominacion-comercial.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-denominacion-comercial.test.ts`
- `src/modules/sales/ordenes/utils/pedido/armar-payload-envio-con-sello.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Alerta falsa 'falta cliente' tras elegir del catálogo; denominación comercial no debe actualizar el catálogo Contpaqi
