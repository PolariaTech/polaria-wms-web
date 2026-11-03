<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** POL-400
**Rama:** dani/pol-400-deuda-tecnica-dividir-modal-orden-venta
**Responsable:** Daniel De Jesus Galvis Zambrano
**Confianza:** 70%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/types/orden-venta-create-modal.types.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/orden-venta-create-helpers.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/components/modals/CatalogStatusHint.tsx` — archivo nuevo
- `src/modules/sales/ordenes/components/modals/CaptureSection.tsx` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/aviso-direccion-ov.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/aviso-direccion-ov.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/campos-faltantes-ov.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/campos-faltantes-ov.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/payload-envio-ov.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/hooks/useClienteOv.ts` — archivo nuevo
- `src/modules/sales/ordenes/hooks/useClienteOv.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/hooks/useLineasOv.ts` — archivo nuevo
- `src/modules/sales/ordenes/hooks/useLineasOv.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/hooks/useOtOv.ts` — archivo nuevo
- `src/modules/sales/ordenes/hooks/useOtOv.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/hooks/useEnvioOv.ts` — archivo nuevo
- `src/modules/sales/ordenes/hooks/useEnvioOv.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureStart.tsx` — archivo nuevo
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePreview.tsx` — archivo nuevo
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePickOt.tsx` — archivo nuevo
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureForm.tsx` — archivo nuevo
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormEntrega.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/ordenes/hooks/cargar-orden-detalle.ts` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/ordenes/hooks/validar-envio-ov.ts` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/ordenes/hooks/confirmar-envio-ov.ts` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/ordenes/components/modals/OrdenVentaDiscrepanciasDialog.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx` — autorizada por el usuario el 2026-11-03

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
POL-400 parte el modal de la orden de venta en helpers, funciones puras, hooks y un componente por paso, sin cambiar el comportamiento.
