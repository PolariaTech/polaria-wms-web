<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-058
**Rama:** mauro/req-058-flujo-estados-orden
**Responsable:** Mauro
**Confianza:** 60%

### Zonas que voy a tocar
- `src/modules/sales/shared/`
- `src/modules/sales/ordenes/`
- `src/modules/jefe-bodega/`
- `src/modules/custodio/`
- `src/modules/admin-panel/inventario-mercancia/`

### Compartidos (cambio mínimo y aviso)
- `src/modules/sales/index.ts`

### Por qué
REQ-058 y REQ-063: la orden debe pasar de alistado a revisado y luego a despachado segun los chulos de la foto; hoy despachada y la revision se aplanan en alistada.
