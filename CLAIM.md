<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-189
**Rama:** dani/req-189-alerta-impresion-no-se-quita
**Responsable:** Dani
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/print/print-correo-fallo.ts`
- `src/modules/sales/ordenes/print/print-correo-fallo.test.ts`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.ts`
- `src/modules/sales/ordenes/print/auto-print-ov-tras-emitir.test.ts` — archivo nuevo
- `CHANGELOG.md`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
REQ-189: la alerta de impresion no se quita (marca local sin reconciliar con el servidor) y un ChunkLoadError de pestaña vieja se muestra como correo no enviado
