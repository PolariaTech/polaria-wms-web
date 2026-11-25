<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-412
**Tickets:** REQ-412, REQ-413, REQ-415
**Funcionalidad:** datos de despacho al elegir y confirmar la orden
**Rama:** mauro/req-412-datos-despacho-orden
**Responsable:** Mauro
**Confianza:** 70%

### Zonas que voy a tocar
- `src/app/despacho/DespachoPublicoLista.tsx`
- `src/app/despacho/DespachoPublicoLista.test.tsx`
- `src/app/despacho/page.tsx`
- `src/app/despacho/page.test.tsx`
- `src/app/despacho/api/route.ts`
- `src/app/despacho/api/route.test.ts`
- `src/modules/sales/ordenes/despacho/despacho-publico.ts`
- `src/modules/sales/ordenes/despacho/despacho-publico.test.ts`
- `src/modules/sales/ordenes/despacho/despacho-publico.service.ts`
- `src/modules/sales/ordenes/despacho/despacho-publico.service.test.ts`

### Compartidos (cambio mínimo y aviso)
- `schemas/schema_despacho.md`

### Por qué
La pantalla de despacho pide una vez quién despacha, muestra despachador y transportista al confirmar, y enseña denominación comercial, OT y orden de compra al elegir la orden.
