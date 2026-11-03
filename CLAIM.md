<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-159
**Rama:** lucho/req-159-abrir-html-legible
**Responsable:** Lucho
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/shared/OrigenAdjuntosCards.tsx`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.ts`
- `src/modules/sales/ordenes/utils/origen/origen-adjuntos.test.ts`
- `src/app/api/ov-adjuntos/file/route.ts`
- `src/app/api/ov-adjuntos/eml-parts/file/route.ts`
- `src/modules/sales/ordenes/utils/origen/eml-attachments.ts`
- `src/modules/sales/ordenes/utils/origen/eml-attachments.test.ts`
- `src/lib/supabase/upload-ov-adjunto.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
El ojo abre HTML; hay que servir inline con Content-Type legible en Chrome sin forzar descarga.
