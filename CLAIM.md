<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-186
**Rama:** dani/req-186-comprimir-pdf-impresion
**Responsable:** Dani
**Confianza:** 90%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-landscape-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-tarea-almacen-pdf.ts`
- `src/modules/sales/ordenes/print/render-orden-pdf-size.test.ts`
- `docs/REQ-186-IMPRESION-413.md`

### Compartidos (cambio mínimo y aviso)
- `CHANGELOG.md`

### Por qué
Agregar compress: true a los tres new jsPDF (landscape 544 y 560; vertical 346) para que el PDF base64 no supere el límite de 4,5 MB de Vercel (413), más una prueba de tamaño y el documento del análisis.
