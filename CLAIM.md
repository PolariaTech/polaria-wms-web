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
- `src/modules/sales/ordenes/hooks/aplicar-reagrupacion-ov.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaReagruparOtModal.tsx`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Reorganizar divide también por día y horario de entrega (REQ-262, REQ-273)
