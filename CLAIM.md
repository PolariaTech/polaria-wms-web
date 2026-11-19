<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-325
**Rama:** lucho/req-325-lote-bugs-mejoras
**Responsable:** Lucho
**Confianza:** 55%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/` — carpeta (excepción)
- `src/modules/sales/correos/` — carpeta (excepción)
- `src/modules/sales/shared/` — carpeta (excepción)
- `src/components/shared/form/PolariaConfirmDialog.tsx` — autorizada por el usuario el 2026-11-19
- `src/components/shared/form/PolariaConfirmDialog.test.tsx` — autorizada por el usuario el 2026-11-19
- `schemas/schema_editar_pedido.md` — autorizada por el usuario el 2026-11-19
- `schemas/checklist_manual_lote_revision_ov.md` — autorizada por el usuario el 2026-11-19

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Soft-lock de lote Lucho: REQ-325,326,327,328,329,330,331,332,335,337,338,340,343,344. Carpetas porque las zonas exactas se afinan al trabajar cada ticket; el Sheet lo marca el dev.
