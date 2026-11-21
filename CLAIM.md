<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-374
**Rama:** lucho/req-374-sincronizar-centro-por-ot
**Responsable:** Lucho
**Confianza:** 85%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.test.ts`
- `src/modules/sales/ordenes/hooks/efectos-formulario-ot.ts`
- `src/modules/sales/ordenes/hooks/efectos-formulario-ot.test.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-cabecera-renglon.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-cabecera-renglon.test.ts`
- `src/modules/sales/ordenes/hooks/cabecera-ot-desde-hija.ts`
- `src/modules/sales/ordenes/hooks/cabecera-ot-desde-hija.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaModalShell.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaFormToolbar.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormPedido.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/hooks/use-orden-venta-create-cabecera-state.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.ts`
- `src/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/hooks/aplicar-cabecera-con-sello-usuario.ts`
- `src/modules/sales/ordenes/hooks/aplicar-cabecera-con-sello-usuario.test.ts`
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.ts` — autorizada por el usuario el 2026-11-21
- `src/modules/sales/ordenes/components/modals/detalle-venta-presentacion.test.ts` — autorizada por el usuario el 2026-11-21

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/ordenes/types/orden-venta-form-estado.ts`

### Por qué
Al paginar entre OT, centroConsumo único se desincroniza de hija.almacen y pisa o homogeneiza centros no tocados
