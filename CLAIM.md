<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-387
**Rama:** dani/req-387-reintentar-correos-web
**Responsable:** Dani
**Confianza:** 84%

### Zonas que voy a tocar
- `src/modules/sales/correos/components/CorreosFiltros.tsx`
- `src/modules/sales/correos/components/CorreosTable.tsx`
- `src/modules/sales/correos/components/AccionIngreso.tsx`
- `src/modules/sales/correos/services/correos.client.ts`
- `src/modules/sales/correos/types/correos.types.ts`
- `src/modules/sales/correos/hooks/useIngresoCorreo.ts`
- `src/modules/sales/correos/hooks/useCorreosIngreso.ts`
- `src/modules/sales/correos/utils/estado-lista-url.ts`
- `src/modules/sales/correos/utils/estado-ingreso.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaCypherDrawerContent.tsx` — autorizada por el usuario el 2026-11-23
- `src/modules/sales/ordenes/components/modals/use-orden-venta-cypher-drawer-content.ts` — autorizada por el usuario el 2026-11-23
- `src/modules/sales/ordenes/components/modals/EntregaMapaModal.tsx` — autorizada por el usuario el 2026-11-23
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenCamera.tsx` — autorizada por el usuario el 2026-11-23

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/correos/utils/estado-lista-url.test.ts`
- `src/modules/sales/correos/components/AccionIngreso.test.tsx`
- `src/modules/sales/correos/services/correos.client.test.ts`

### Por qué
Boton filtro, modal Reintentar y reintento masivo en correos
