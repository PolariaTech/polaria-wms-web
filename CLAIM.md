<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-433
**Rama:** lucho/req-433-estado-ov-por-foto
**Responsable:** Lucho
**Confianza:** 60%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/surtido/orden-surtido-sync-estado.ts`
- `src/modules/sales/ordenes/surtido/procesar-captura-foto.ts`
- `src/modules/sales/ordenes/surtido/avanzar-estado-surtido.server.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
Foto de surtido guardada pero la OV no avanza de confirmada a alistamiento: el avance de estado falla en silencio (solo console.error) y no queda registro en auditoria. Zonas: sincronizacion de estado, procesamiento de la foto y llamada a Nest.
