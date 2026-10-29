# Checklist manual — modal «Reorganizar órdenes de trabajo» (REQ-125, POL-391)

Fecha: 28/10/2026 · Repo: polaria-wms-web · Resultado global: **PASS** (probado manualmente por el dev en DEV/local)

| # | Formulario | Ítem | Resultado |
|---|---|---|---|
| 1 | Reorganizar OT con IA | Foco inicial al abrir el modal | PASS |
| 2 | Reorganizar OT con IA | Tab: Instrucción → Cancelar → Generar; Generar fuera del orden mientras está deshabilitado | PASS |
| 3 | Reorganizar OT con IA | El modal no cierra por clic afuera con texto sin guardar | PASS |
| 4 | Reorganizar OT con IA | Escape cierra solo el modal, no el Cypher | PASS |
| 5 | Reorganizar OT con IA | Instrucción de más de 4000 caracteres muestra el mensaje y deshabilita Generar | PASS |
| 6 | Reorganizar OT con IA | Al cerrar el Cypher se cierra el chat de la instrucción | PASS |
| 7 | Reorganizar OT con IA | Textos de ayuda indican que se pueden crear, modificar o eliminar OT | PASS |

## Flujo REQ-187 — un solo «Generar» (reorganizar o releer correo y archivos)

Repo: polaria-wms-web · Se prueba en DEV/local contra una OV `por_confirmar` con archivos originales (copias de prueba OV-00000004 y OV-00000005 del schema demo). El resultado de cada ítem se completa cuando el dev lo prueba; ninguno se da por PASS sin haberlo visto.

| # | Formulario | Ítem | Resultado |
|---|---|---|---|
| 8 | Reorganizar OT con IA | Con instrucción de reagrupación («junta comedor y bares»), «Generar» muestra «Polo is working» y termina en la propuesta de reagrupación de siempre | PENDIENTE |
| 9 | Reorganizar OT con IA | Con instrucción sobre los documentos («verifica contra el total, deben ser 24 OT»), «Generar» relee el correo y muestra «Corregir con el correo» con antes/después | PENDIENTE |
| 10 | Reorganizar OT con IA | La capa de carga queda sobre el modal; «Cancelar» pide «¿Seguro que quieres cancelar este proceso?» y «Seguir esperando» la mantiene | PENDIENTE |
| 11 | Reorganizar OT con IA | Escape con la capa de carga abierta abre/cierra la confirmación y no cierra el modal ni el Cypher | PENDIENTE |
| 12 | Reorganizar OT con IA | Foco y Tab dentro de la capa de carga y de la confirmación (el foco no sale hacia el modal de atrás) | PENDIENTE |
| 13 | Reorganizar OT con IA | «Aplicar al borrador» reemplaza las OT del formulario, y «Deshacer» las devuelve | PENDIENTE |
| 14 | Reorganizar OT con IA | Cada aviso de la propuesta nombra el archivo y el singular «1 renglón» se lee bien | PENDIENTE |
| 15 | Reorganizar OT con IA | Un 400 del servidor muestra «La solicitud no es válida. Revisa la instrucción e inténtalo de nuevo.» | PENDIENTE |
| 16 | Reorganizar OT con IA | «Modificar con IA» desde el «+» abre el modal (no solo el formulario), y al cerrar el Cypher el modal no reaparece al reabrirlo | PENDIENTE |
| 17 | Reorganizar OT con IA | «Recepción del correo» del Cypher queda cerrada al abrirlo | PENDIENTE |
