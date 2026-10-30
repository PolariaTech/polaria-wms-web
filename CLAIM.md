<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-230
**Rama:** dani/req-230-ov-edicion-respeta-guardado
**Responsable:** Dani
**Confianza:** 50%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.ts` — archivo nuevo
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts` — autorizada por el usuario el 2026-10-30

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Al reabrir una OV de tercero en por_confirmar, el modal reconstruye OCC y notas desde origen_correo y pisa lo guardado; el arreglo hace que lo guardado mande. Cambio minimo en el modal (2 puntos: carga de edicion y regeneracion con Mateo); la logica va en una funcion pura nueva con pruebas. Sin criterios de aceptacion en el Sheet, capa compartida y modal sin pruebas.
