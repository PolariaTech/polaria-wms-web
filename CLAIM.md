<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-194
**Rama:** dani/req-194-validacion-foto-qr
**Responsable:** Dani
**Confianza:** 75%

### Zonas que voy a tocar
- `src/app/captura-orden/[idOrdenVenta]/api/route.ts`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenUploadForm.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenUploadForm.test.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenCard.tsx`
- `src/app/captura-orden/[idOrdenVenta]/CapturaOrdenCamera.tsx` — archivo nuevo
- `src/modules/sales/ordenes/surtido/openai-surtido.client.ts`
- `src/modules/sales/ordenes/surtido/openai-surtido.client.test.ts`
- `src/modules/sales/ordenes/surtido/orden-surtido.types.ts`
- `src/modules/sales/ordenes/surtido/validate-surtido-foto-calidad.ts` — archivo nuevo
- `src/modules/sales/ordenes/surtido/validate-surtido-foto-calidad.test.ts` — archivo nuevo
- `src/modules/sales/ordenes/surtido/estimate-surtido-precision.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Validar calidad de foto QR de hoja impresa, errores claros y marco de cámara
