<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-262
**Rama:** dani/req-262-dividir-ov-reorganizar
**Responsable:** sin responsable
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/services/reagrupar-ot.client.ts`
- `src/modules/sales/ordenes/services/reagrupar-ot.client.test.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupacion-modal-estado.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupacion-modal-estado.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaReagruparOtModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaReagruparOtModal.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCapturePreview.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/components/modals/OrdenVentaDiscrepanciasDialog.tsx` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/types/orden-venta-form-estado.ts` — autorizada por el usuario el 2026-11-06
- `src/modules/sales/ordenes/types/orden-venta-create-modal.types.ts` — autorizada por el usuario el 2026-11-06

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Dividir la OV por orden de compra desde Reorganizar (REQ-262, REQ-273)
