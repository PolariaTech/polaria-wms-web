<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** POL-416
**Rama:** dani/pol-416-mostrar-reintentar-en-el-correo-con-ingreso
**Responsable:** Dani
**Confianza:** 85%

### Zonas que voy a tocar
- `src/modules/sales/correos/hooks/useIngresoCorreo.ts`
- `src/modules/sales/correos/components/AccionIngreso.test.tsx`
- `src/modules/sales/correos/components/CorreosTable.ingreso.test.tsx`
- `src/modules/sales/correos/utils/estado-ingreso.test.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
POL-416 quita el tope de 5 min del sondeo y muestra Reintentar al vencer
