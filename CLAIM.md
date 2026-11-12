<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-310
**Rama:** dani/req-309-solicitado-especificacion
**Responsable:** sin responsable
**Confianza:** 90%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/origen/correo-chrome.ts`
- `src/modules/sales/ordenes/utils/origen/correo-chrome.test.ts`
- `src/modules/sales/ordenes/utils/pedido/merge-lineas-bd-y-origen.test.ts` — autorizada por el usuario el 2026-11-12
- `src/modules/sales/ordenes/utils/display/resolve-sku-visible.ts` — autorizada por el usuario el 2026-11-12

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Conectar correo-contacto-comprador.ts en la copia web de correo-chrome (REQ-310, lote 1, PR #127)
