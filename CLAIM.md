<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-205
**Rama:** mauro/req-205-filtro-entrega-hoy-manana
**Responsable:** Mauro
**Confianza:** 70%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/pages/filtrar-por-fecha-entrega.ts`
- `src/modules/sales/ordenes/components/pages/filtrar-por-fecha-entrega.test.ts`
- `src/components/layouts/shell/AppTopbar.tsx`
- `src/components/layouts/shell/AppTopbar.test.tsx`
- `src/stores/ov-fecha-filtro.store.ts`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx#OperadorOrdenesVentaPageContent`

### Compartidos (cambio mínimo y aviso)
- `--confianza`

### Por qué
El filtro de la fecha del topbar debe incluir la entrega de hoy y la de manana. Hoy solo compara el dia en curso.
