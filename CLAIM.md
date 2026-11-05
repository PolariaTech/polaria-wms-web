<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-264
**Rama:** dani/req-264-impresion-batch-ot
**Responsable:** Dani
**Confianza:** 60%

### Zonas que voy a tocar
- `src/modules/sales/correos/components/VentasSidebar.tsx`
- `src/modules/sales/correos/components/VentasSidebar.test.tsx`
- `src/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent.tsx`
- `src/modules/sales/ordenes/print/download-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/map-orden-tarea-almacen.ts`
- `src/modules/sales/ordenes/surtido/captura-intento.service.ts`

### Compartidos (cambio mínimo y aviso)
- `src/config/routes.ts`

### Por qué
Lote REQ-264 + REQ-152 + REQ-240 (impresión en batch por selección de OT y reimpresión de una OT) y pantalla de estado de fotos de captura; dos opciones nuevas en el menú de Ventas. Las páginas y componentes nuevos no se reclaman.
