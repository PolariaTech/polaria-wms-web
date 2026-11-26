<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-366
**Rama:** mauro/req-366-precio-sugerido-linea
**Responsable:** Mauro
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/hooks/useClienteOv.ts`
- `src/modules/sales/ordenes/hooks/useClienteOv.test.ts`
- `src/modules/sales/ordenes/hooks/sembrar-lineas-desde-origen-catalogo-picker.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCaptureFormLineas.test.tsx`
- `src/modules/sales/ordenes/utils/pedido/map-detalle-lineas-a-form.ts`
- `src/modules/sales/ordenes/hooks/cargar-orden-al-abrir.ts`
- `src/modules/sales/ordenes/hooks/seleccionar-comprador-ov.ts`
- `src/modules/sales/ordenes/hooks/useLineasOv.ts`
- `schemas/schema_editar_pedido.md`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Rellenar el precio que falta con el ultimo del cliente, la lista o la equivalencia, y marcarlo como sugerido.
