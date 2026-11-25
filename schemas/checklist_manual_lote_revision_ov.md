# Checklist manual — lote En Revisión OV + lote UI OV/correo Cypher + lote REQ-325 (REQ-199…340)

Fecha: 24/11/2026 · Repo: polaria-wms-web · Resultado global: **PASS**

| # | Formulario / superficie | Ítem | Resultado |
|---|---|---|---|
| 1 | Editar pedido | REQ-278: Entrega en orden fecha/día/Hora desde/Hora hasta → contacto → teléfono → correo → dirección → notas al final; moneda en Datos del pedido; prioridad no visible | PASS |
| 2 | Editar pedido | Conteo de productos visible; footer con iconos Cypher y tooltips; Cypher con nombre × Cerrar (REQ-283) | PASS |
| 3 | Listado Órdenes venta | Solo H1 «Órdenes venta»; buscar/total/refresh/Nueva venta a la derecha | PASS |
| 4 | Nueva venta + archivo | Tras Continuar aparece (+); Cypher con interpretación; Guardar avance crea borrador | PASS |
| 5 | Editar pedido (avance) | Verificar productos → Guardar avance → reabrir: siguen verificados | PASS |
| 6 | Nueva venta | Elegir razón social con OV confirmada previa → dirección prellena la última confirmada | PASS |
| 7 | Editar pedido | Modal no cierra por clic afuera con datos sin guardar; Cancelar pide confirmación; tabulación sigue el orden de Tabla 2 del schema v1.8 | PASS |
| 8 | Editar pedido | REQ-279: con total en cuerpo/PDF/EML, el aviso de total solicitud vs OV aparece; no bloquea confirmar | PASS |
| 9 | Editar pedido / preview | REQ-285/289: hint de campo sin inventar notas; zoom +/− en preview de adjunto | PASS |
| 10 | Editar pedido | REQ-286: notas no inventan «Entrega … / Destino:» ni muestran cutoff inventado en toolbar | PASS |
| 11 | Editar pedido | Datos del pedido muestra OC, centro de consumo y moneda sin el campo retirado «Referencia de pedido» (`OrdenVentaCaptureFormPedido`) | PASS |
| 12 | Editar pedido | REQ-337: confirmar con fechas distintas entre OT muestra `MSG_FECHAS_DISTINTAS_ENTRE_OT` y no confirma; avance sí puede seguir | PASS |
| 13 | Editar pedido | REQ-340: al mapear desde Mateo las notas no quedan vacías (respaldo); al guardar manda el textarea (prioridad usuario); vacío deliberado se respeta | PASS |
| 14 | Editar pedido | `useClearFieldMarksOv`: editar un campo marcado en amarillo registra discrepancia Inicial/Definitivo; revertir al valor inicial o editar sin marca amarilla la limpia | PASS |
