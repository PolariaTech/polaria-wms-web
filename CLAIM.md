<!-- polaria-reclamo v1 -->
## 🔒 Reclamo de trabajo en paralelo

**Estado:** ACTIVO
**Issue:** REQ-162
**Rama:** dani/req-162-direccion-entrega-sin-contacto
**Responsable:** Dani
**Confianza:** 80%

### Zonas que voy a tocar
- `src/modules/sales/ordenes/utils/pedido/extract-entrega-desde-texto.ts`
- `src/modules/sales/ordenes/utils/pedido/extract-entrega-desde-texto.test.ts`
- `src/modules/sales/ordenes/utils/pedido/map-pedido-extraido-to-form.ts`
- `src/modules/sales/ordenes/ai/openai-pedido.client.ts`

### Compartidos (cambio mínimo y aviso)
Ninguno.

### Por qué
El extractor Ship To y el prompt de Mateo meten correo, fax y teléfono en la dirección de entrega
