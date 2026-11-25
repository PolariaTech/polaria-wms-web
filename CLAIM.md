<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-423
**Rama:** lucho/req-423-fecha-ot-misma-ov
**Responsable:** Lucho
**Confianza:** 60%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/hooks/cambiar-pagina-ot.ts`
- `src/modules/sales/ordenes/hooks/cambiar-pagina-ot.test.ts`
- `src/modules/sales/ordenes/hooks/hidratar-formulario-desde-hija.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-formulario.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-cabecera-renglon.ts`
- `src/modules/sales/ordenes/hooks/sync-ot-cabecera-renglon.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Bug REQ-423: al cambiar la fecha de una OT no se propaga a las demas OT de la misma OV. Causa probable: REQ-374 (34808c8) pagina OT con propagarFechaOv:false y la hidratacion pisa la fecha editada.
