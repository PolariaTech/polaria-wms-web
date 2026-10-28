<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-177
**Rama:** mauriciomanjarres/req-177-ajustar-filtro-fecha-entrega
**Responsable:** Mauro
**Confianza:** 60%

### Zonas que voy a tocar
- `src/components/layouts/shell/`
- `src/stores/ov-fecha-filtro.store.ts`
- `src/modules/sales/ordenes/components/pages/`
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/shared/services/sales.service.test.ts`

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/shared/types/sales.types.ts`

### Por qué
El filtro de la fecha del topbar debe usar la fecha de entrega e incluir las ordenes sin esa fecha. Hoy el listado del operador filtra por fecha de creacion.
