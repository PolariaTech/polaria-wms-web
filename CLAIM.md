<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-187
**Rama:** dani/req-187-chat-ot-extension-leer-pedido
**Responsable:** Dani
**Confianza:** 60%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaReagruparOtModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaReagruparOtModal.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx#obtenerSolicitudReagrupacion`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx#handleAplicarReagrupacion`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx#handleDeshacerReagrupacion`
- `src/modules/sales/ordenes/utils/ot/reagrupar-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupar-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupacion-modal-estado.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupacion-modal-estado.test.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.test.ts`
- `src/modules/sales/ordenes/services/correccion-correo.client.ts` — archivo nuevo
- `src/modules/sales/ordenes/services/correccion-correo.client.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/ot/aplicar-correccion-correo.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/ot/aplicar-correccion-correo.test.ts` — archivo nuevo

### Compartidos (cambio mínimo y aviso)
- `CHANGELOG.md`

### Por qué
Modo 'corregir contra el correo' del chat de OT en la web: cliente del endpoint nuevo, diff en el modal y aplicación que reemplaza hijas y líneas del formulario (casos OV-940 y OV-943). No toca OperadorOrdenesVentaPageContent.tsx ni print/ (PR #83).
