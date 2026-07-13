# Backend: flujo procesamiento (referencia frio)

El front ya llama estos endpoints. El API Nest debe implementar la lógica de negocio descrita abajo.

## Convención de vínculo solicitud ↔ tarea

En `tarea_cola.descripcion` (o campo `id_solicitud_procesamiento` si existe en DB) incluir:

```
solicitudProcesamiento:<uuid>
```

El front también acepta `idSolicitudProcesamiento` / `id_solicitud_procesamiento` en la respuesta JSON de tareas.

## Convención post-cierre (1 o 2 traslados)

En `orden_trabajo.observaciones` de cada OT post-cierre incluir:

```
rolDevolucion:procesado
rolDevolucion:desperdicio
```

- **procesado**: siempre se crea (producto secundario / resultado).
- **desperdicio**: solo si `sobrante_kg > 0` (sobrante de primario).

El front detecta estas órdenes para mostrar tareas al operario y llamar `aplicar` al ejecutarlas.

## 1. POST `/procesamiento/solicitudes`

- Crear `solicitud_procesamiento` con `estado = pendiente`.
- Validar stock en almacenamiento (misma regla que el front).
- **No** crear `tarea_cola` aún (el jefe asigna operario después).

## 2. PATCH `/procesamiento/solicitudes/:id/asignar-operario`

Body: `{ codigoCuenta, idBodega, idOperario }`

Debe (como frio al pulsar «Asignar»):

1. Persistir `id_operario` en la solicitud.
2. Crear `orden_trabajo` con:
   - `tipoFlujo = a_procesamiento`
   - `id_producto` = primario de la solicitud
   - `cantidad` = `kilos_primario`
   - `id_asignado` = operario
   - `id_ubicacion_origen` = slot de almacenamiento con stock (FIFO o regla existente en salidas)
   - `id_ubicacion_destino` = slot libre en zona procesamiento
   - `observaciones` = `flujo:a_procesamiento|solicitudProcesamiento:<uuid>`
3. Crear `tarea_cola` con:
   - `tipo = procesamiento`
   - `estado = pendiente`
   - `id_asignado` = operario
   - `id_orden_trabajo` = la OT creada
   - `id_solicitud_procesamiento` = uuid (si la columna existe)
   - `titulo` = código solicitud + nombre primario
   - `descripcion` = `Almacenamiento → Procesamiento · solicitudProcesamiento:<uuid> · X kg`

## 3. POST `/procesamiento/solicitudes/:id/iniciar`

Body: `{ codigoCuenta, idBodega, idProcesador? }`

Lo invoca el **operario** al completar la tarea de movimiento (antes de cerrar `tarea_cola`).

Debe (equivalente a frio «En curso»):

1. Validar que el usuario es el operario asignado.
2. Ejecutar movimiento de inventario: **descontar** `kilos_primario` del almacenamiento y ubicar en zona procesamiento.
3. Actualizar solicitud: `estado = en_proceso`, `kg_primario_descontado` si aplica.
4. **Auto-asignar procesador** (primer procesador de la bodega o regla existente), equivalente a frio.

## 4. POST `/operaciones/tareas/:id/completar`

Para tareas `tipo = procesamiento`, marcar `tarea_cola.estado = completada` (el movimiento de stock lo hace `iniciar`).

Orden de llamadas desde el front (fase 1): **primero `iniciar`, luego `completar`**.

## 5. POST `/procesamiento/solicitudes/:id/cerrar`

Body: `{ codigoCuenta, idBodega, kilosMerma, kilosSecundario? }`

Lo invoca el **procesador** al declarar merma. No debe usar `SensitiveWriteGuard` genérico (el procesador no tiene `inventory:write` global).

Debe:

1. Validar solicitud `en_proceso` y procesador asignado.
2. Persistir `kilos_merma`, calcular `sobrante_kg` si aplica.
3. Actualizar `estado = pendiente_cierre`.

## 6. POST `/procesamiento/solicitudes/:id/ordenes-post-cierre`

Body: `{ codigoCuenta, idBodega }`

Lo invoca el front justo después de `cerrar` (rol **procesador** o **jefe_bodega**).

Debe crear **1 o 2** `orden_trabajo` + `tarea_cola` para el **mismo operario** de la solicitud:

| OT | Producto | rolDevolucion | Condición |
|----|----------|---------------|-----------|
| 1 | Secundario (procesado) | `procesado` | Siempre |
| 2 | Primario (sobrante) | `desperdicio` | Solo si `sobrante_kg > 0` |

Cada OT: origen = slot en zona procesamiento, destino = slot libre en almacenamiento.

## 7. POST `/procesamiento/solicitudes/:id/ordenes/:idOrden/aplicar`

Lo invoca el **operario** al completar cada tarea post-cierre (antes de `completar` tarea).

Debe ejecutar el movimiento de inventario de esa OT (procesamiento → almacenamiento).

Orden de llamadas desde el front (fase post-cierre): **primero `aplicar`, luego `completar`**.

## 8. POST `/procesamiento/solicitudes/:id/terminar`

Debe llamarse cuando **todas** las OT post-cierre estén aplicadas (frio: `intentarMarcarProcesamientoTerminadoTrasTraslado`).

Puede invocarse desde el backend al aplicar la última orden, o desde el front si el API no lo hace automáticamente.

## Migraciones SQL

| Archivo | Qué resuelve |
|---------|----------------|
| `docs/migrations/047_procesamiento_flujo.sql` | `id_operario`, `id_solicitud_procesamiento` en tareas |
| `docs/migrations/048_movimiento_tipo_referencia_procesamiento.sql` | Check `chk_movimiento_tipo_referencia` incluye `solicitud_procesamiento` (merma al cerrar) |

Sin **048**, `cerrar` falla con: `violates check constraint "chk_movimiento_tipo_referencia"`.

## Enum / constraint

- Agregar `a_procesamiento` al enum o check de `tipo_flujo` en `orden_trabajo` si aplica.

## Prueba manual E2E

1. Operador crea orden → solicitud `pendiente`.
2. Jefe ve ítem en panel **Almacenamiento** → asigna operario.
3. Operario ve tarea «Almacenamiento → Procesamiento» → ejecuta.
4. Stock pasa a zona procesamiento; solicitud `en_proceso`; procesador asignado.
5. Procesador declara merma → `pendiente_cierre`; se crean 1–2 OT post-cierre.
6. Operario ejecuta traslados (resultado ± sobrante) → solicitud `terminada`.
