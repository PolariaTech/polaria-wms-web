<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-275
**Rama:** dani/req-275-correos-resultado-ov
**Responsable:** Dani
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/correos/types/correos.types.ts`
- `src/modules/sales/correos/services/correos.client.ts`
- `src/modules/sales/correos/services/correos.client.test.ts`
- `src/modules/sales/correos/components/CorreosCuerpoTabla.tsx`
- `src/modules/sales/correos/components/FilaCorreo.tsx`
- `src/modules/sales/correos/components/CorreosTable.tsx`
- `src/modules/sales/correos/components/DetalleCorreoModal.tsx`
- `src/modules/sales/correos/components/DetalleCorreoPartes.tsx`
- `src/modules/sales/correos/components/CorreosTable.test.tsx`
- `src/modules/sales/correos/components/CorreosTable.detalle.test.tsx`
- `src/modules/sales/correos/components/CorreosTable.ingreso.test.tsx`
- `src/modules/sales/correos/testing/correos.fixtures.ts`
- `src/modules/sales/correos/utils/correos-formato.ts`
- `src/modules/sales/correos/utils/correos-formato.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Lote correos no tomados (REQ-253, REQ-261, REQ-275): la tabla de correos muestra el resultado de cada correo y la OV en que se convirtió.
