<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-139
**Rama:** mauriciomanjarres/req-139-estado-cola-impresora
**Responsable:** Mauro
**Confianza:** 50%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/print/`
- `src/modules/sales/ordenes/components/pages/`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
REQ-139: al imprimir por QZ el PDF entra a la cola de Windows y hay que leer el estado de la impresora para avisar si está en línea, apagada o pide atención.
