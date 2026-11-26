<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-361
**Rama:** lucho/req-361-archivo-origen-por-ov
**Responsable:** Lucho
**Confianza:** 55%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/CypherRecepcionCorreoStage.tsx`
- `src/modules/sales/ordenes/print-batch/oc-propia-de-ov.ts`
- `src/modules/sales/ordenes/print-batch/armar-paquete-con-oc.ts`
- `src/modules/sales/ordenes/print-batch/resumen-impresion.ts` — autorizada por el usuario el 2026-11-26
- `src/modules/sales/ordenes/print-batch/resumen-impresion.test.ts` — autorizada por el usuario el 2026-11-26
- `src/modules/sales/ordenes/print/render-resumen-impresion-pdf.ts` — autorizada por el usuario el 2026-11-26
- `src/modules/sales/ordenes/print/render-resumen-impresion-pdf.test.ts` — autorizada por el usuario el 2026-11-26
- `src/modules/sales/ordenes/print-batch/armar-paquete-con-oc.test.ts` — autorizada por el usuario el 2026-11-26
- `src/modules/sales/ordenes/components/modals/cypher-drawer-origen-adjuntos.ts` — autorizada por el usuario el 2026-11-26
- `src/modules/sales/shared/services/ovs-del-mismo-correo.ts` — autorizada por el usuario el 2026-11-26
- `src/modules/sales/shared/services/ovs-del-mismo-correo.test.ts` — autorizada por el usuario el 2026-11-26
- `src/modules/sales/ordenes/utils/match/annotate-correo-partido-ov.ts` — autorizada por el usuario el 2026-11-26
- `src/modules/sales/ordenes/utils/match/annotate-correo-partido-ov.test.ts` — autorizada por el usuario el 2026-11-26

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
REQ-361: identificar en la OV de un correo partido qué archivo (PDF/HTML/Excel) la genera, encerrarlo en recuadro, e imprimir solo sus OC después de su OV.
