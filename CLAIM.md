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

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
REQ-361: identificar en la OV de un correo partido qué archivo (PDF/HTML/Excel) la genera, encerrarlo en recuadro, e imprimir solo sus OC después de su OV.
