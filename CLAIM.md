<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-425
**Rama:** lucho/req-425-total-formulario-correccion
**Responsable:** Andrés
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/ot/aplicar-correccion-correo.ts`
- `src/modules/sales/ordenes/utils/ot/aplicar-correccion-correo.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCorreccionCorreoPanel.tsx`
- `src/modules/sales/ordenes/components/modals/reagrupar-ot-modal.types.ts`
- `src/modules/sales/ordenes/components/modals/reagrupacion-modal-ui.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaReagruparOtModal.tsx`
- `src/modules/sales/ordenes/hooks/use-reagrupar-ot-generar.ts`
- `src/modules/sales/ordenes/hooks/use-reagrupar-ot-generar.test.ts`
- `src/modules/sales/ordenes/hooks/aplicar-reagrupacion-ov.ts`
- `src/modules/sales/ordenes/hooks/aplicar-reagrupacion-ov.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCorreccionCorreoPanel.test.tsx`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Corrección con el correo ignora el total del formulario y dice nada que corregir
