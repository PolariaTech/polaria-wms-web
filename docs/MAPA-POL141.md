# Mapa de bodega — verificación POL-141

Sincronización de estados visuales con persistencia. Ver también API: `docs/MAPA-POL141.md`.

## POL-182 — Refetch de ubicaciones

`EstadoBodegaPageContent` escucha `lastEventAt` de `useWarehouseStateRealtime`. Tras cada evento Realtime de `warehouse_state`, se hace refetch debounced (500 ms) de `ubicacion` para alinear `estado_slot` con el stock actual.

La ocupación visual del grid sigue priorizando `warehouse_state.cantidad > 0` (mapper); el refetch corrige routing de sección (`en_proceso`, etc.).

## Pruebas

```bash
npm test -- useWarehouseStateRealtime
npm test -- estado-bodega-mapper
```

## SQL

`polaria-wms-db/scripts/validate-mapa-pol141.sql` — assert de coherencia `estado_slot` vs stock.
