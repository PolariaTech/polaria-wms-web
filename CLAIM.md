<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-318
**Rama:** dani/req-318-ingresar-desde-correo
**Responsable:** Dani
**Confianza:** 80%

### Zonas que voy a tocar
- `src/app/(shell)/dashboard/(operacion-cuenta)/ventas/correos-mateo/page.tsx`
- `src/app/(shell)/dashboard/(operacion-cuenta)/ventas/correos-descartados/page.tsx`
- `src/modules/sales/correos/components/CorreoCompletoVista.tsx`
- `src/modules/sales/correos/components/CorreoCompletoVista.test.tsx`
- `src/modules/sales/correos/components/CorreosTable.tsx`
- `src/modules/sales/correos/components/CorreosTable.test.tsx`
- `src/modules/sales/correos/components/CorreosTable.paginacion.test.tsx`
- `src/modules/sales/correos/components/CorreosTable.detalle.test.tsx`
- `src/modules/sales/correos/components/CorreosTable.ingreso.test.tsx`
- `src/modules/sales/correos/components/CorreosTable.estado.test.tsx`
- `src/modules/sales/correos/components/CorreosCuerpoTabla.tsx`
- `src/modules/sales/correos/components/FilaCorreo.tsx`
- `src/modules/sales/correos/components/DetalleCorreoModal.tsx`
- `src/modules/sales/correos/components/CorreosFiltros.tsx`
- `src/modules/sales/correos/components/AccionIngreso.tsx`
- `src/modules/sales/correos/hooks/useBloquesCorreos.ts`
- `src/modules/sales/correos/hooks/useCorreosIngreso.ts`
- `src/modules/sales/correos/hooks/useIngresoCorreo.ts`
- `src/modules/sales/correos/services/correos.client.ts`
- `src/modules/sales/correos/services/correos.client.test.ts`
- `src/modules/sales/correos/services/correos.lectura.ts`
- `src/modules/sales/correos/types/correos.types.ts`
- `src/modules/sales/correos/testing/correos.fixtures.ts`
- `CHANGELOG.md`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Ingresar desde el correo completo, volver al mismo lugar y modo procesados (REQ-318, REQ-314)
