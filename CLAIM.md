<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-104
**Rama:** dani/req-104-correos-descartados-ingreso
**Responsable:** Dani
**Confianza:** 60%

### Zonas que voy a tocar
- `src/components/layouts/shell/AppTopbar.tsx`
- `src/components/layouts/shell/AppTopbar.test.tsx`
- `src/app/(shell)/dashboard/(operacion-cuenta)/ventas/ordenes/page.tsx`
- `src/modules/sales/README.md`
- `src/app/(shell)/dashboard/(operacion-cuenta)/ventas/layout.tsx` — archivo nuevo
- `src/app/(shell)/dashboard/(operacion-cuenta)/ventas/correos-descartados/page.tsx` — archivo nuevo
- `src/app/(shell)/dashboard/(operacion-cuenta)/ventas/correos-mateo/page.tsx` — archivo nuevo
- `src/modules/sales/correos/components/VentasSidebar.tsx` — archivo nuevo
- `src/modules/sales/correos/components/VentasSidebar.test.tsx` — archivo nuevo
- `src/modules/sales/correos/components/CorreosTable.tsx` — archivo nuevo
- `src/modules/sales/correos/components/CorreosTable.test.tsx` — archivo nuevo
- `src/modules/sales/correos/components/CorreosFiltros.tsx` — archivo nuevo
- `src/modules/sales/correos/services/correos.client.ts` — archivo nuevo
- `src/modules/sales/correos/services/correos.client.test.ts` — archivo nuevo
- `src/modules/sales/correos/types/correos.types.ts` — archivo nuevo
- `src/modules/sales/correos/hooks/useCorreosIngreso.ts` — archivo nuevo
- `src/app/(shell)/dashboard/(operacion-cuenta)/ventas/correo/[messageId]/page.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/components/CorreoCompletoVista.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/components/CorreoCompletoVista.test.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/utils/correos-formato.ts` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/utils/correos-formato.test.ts` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/components/AccionIngreso.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/components/DetalleCorreoModal.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/components/DetalleCorreoPartes.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/components/FilaCorreo.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/components/CorreosCuerpoTabla.tsx` — autorizada por el usuario el 2026-11-03
- `src/modules/sales/correos/components/CorreoCuerpo.tsx` — autorizada por el usuario el 2026-11-03

### Compartidos (cambio mínimo y aviso)
- `src/config/routes.ts`
- `src/modules/sales/index.ts`
- `CHANGELOG.md`

### Por qué
Sidebar de Ventas con listas de correos descartados y recibidos de n8n, e ingreso manual como OV
