<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-280
**Rama:** dani/req-280-duplicado-lineas-ov
**Responsable:** sin responsable
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/shared/services/sales.service.ts`
- `src/modules/sales/shared/services/sales.service.test.ts`
- `CHANGELOG.md`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Reserva atómica de la materialización de líneas desde origen_correo (duplicado x2)
