<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-159
**Rama:** lucho/req-159-lote-edicion-ov
**Responsable:** Lucho
**Confianza:** 55%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/OrdenVentaCreateModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawer.tsx`
- `src/modules/sales/ordenes/components/modals/CypherClienteVsMateoSection.tsx`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`
- `src/modules/sales/ordenes/components/shared/OrigenAdjuntosCards.tsx`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.test.ts`
- `src/modules/sales/ordenes/utils/origen/eml-attachments.ts`
- `src/modules/sales/ordenes/utils/origen/eml-attachments.test.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.ts`
- `src/modules/sales/ordenes/utils/origen/pedido-from-origen-correo.test.ts`
- `src/modules/sales/ordenes/utils/origen/materialize-ov-desde-origen.ts`
- `src/app/api/ov-adjuntos/file/route.ts`
- `src/app/api/ov-adjuntos/eml-parts/file/route.ts`
- `src/lib/supabase/upload-ov-adjunto.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.ts`
- `src/modules/sales/ordenes/utils/pedido/resolve-cabecera-guardada.test.ts`
- `src/modules/sales/ordenes/utils/pedido/foco-formulario-ov.ts`
- `src/modules/sales/ordenes/utils/pedido/persist-linea-avance.ts`
- `src/modules/sales/ordenes/utils/pedido/persist-linea-avance.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.test.ts`
- `src/modules/sales/ordenes/utils/pedido/centro-consumo-vs-cliente.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupacion-modal-estado.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupacion-modal-estado.test.ts`
- `src/modules/sales/ordenes/utils/ot/reagrupar-ordenes-trabajo.ts`
- `src/modules/sales/ordenes/utils/ot/por-confirmar-revision-alert.ts`
- `src/modules/sales/ordenes/utils/ot/por-confirmar-revision-alert.test.ts`
- `src/modules/sales/ordenes/utils/por-confirmar-revision-alert.ts`
- `src/modules/sales/ordenes/services/reagrupar-ot.client.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts`

### Compartidos (cambio mínimo y aviso)
- `.env.example`

### Por qué
Lote en una rama: REQ-159 HTML ojo legible; REQ-166/169/170/182/195 edición-guardar-confirmar OV y Mateo; REQ-218 ocultar %desc; REQ-219 OPENAI_MODEL (web .env.example; Render/API aparte).
