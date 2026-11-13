<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-313
**Rama:** dani/req-313-correo-partido-varias-ov
**Responsable:** Dani
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/print-batch/armar-paquete-con-oc.ts`
- `src/modules/sales/ordenes/print-batch/armar-paquete-con-oc.test.ts`
- `src/modules/sales/ordenes/print-batch/oc-documentos.ts`
- `src/modules/sales/ordenes/print-batch/oc-documentos.test.ts`
- `src/modules/sales/ordenes/components/modals/CypherRecepcionCorreoStage.tsx`
- `src/modules/sales/ordenes/components/modals/CypherRecepcionCorreoStage.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherStagesBody.tsx`
- `src/modules/sales/ordenes/components/modals/CypherOrigenAdjuntosBlock.tsx`
- `src/modules/sales/ordenes/components/modals/CypherOrigenAdjuntosBlock.test.tsx`
- `src/modules/sales/ordenes/components/shared/OrigenAdjuntosCards.tsx`
- `src/modules/sales/ordenes/components/shared/OrigenAdjuntosCards.test.tsx`
- `CHANGELOG.md`

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/ordenes/print-batch/ImpresionRapidaPageContent.oc.test.tsx`

### Por qué
Aviso de correo partido en el Cypher e impresion de OC sin repetir entre OV hermanas
