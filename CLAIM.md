<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-383
**Tickets:** REQ-383, REQ-397, REQ-401
**Funcionalidad:** El adjunto se lee al abrir la vista previa
**Rama:** mauro/req-383-zoom-vista-previa
**Responsable:** Mauro
**Confianza:** 75%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/components/modals/adjunto-preview-zoom.ts`
- `src/modules/sales/ordenes/components/modals/adjunto-preview-zoom.test.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaAdjuntoPreviewModal.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaAdjuntoPreviewModal.test.tsx`
- `src/modules/sales/ordenes/components/modals/OrdenVentaAdjuntoPreviewModal-helpers.ts`
- `src/modules/sales/ordenes/components/modals/OrdenVentaAdjuntoPreviewModal-helpers.test.ts`
- `src/modules/sales/ordenes/components/modals/AdjuntoPreviewZoomControls.tsx`
- `src/modules/sales/ordenes/components/modals/AdjuntoPreviewZoomControls.test.tsx`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
El EML, el HTML y el PDF abren tan chicos que no se leen
