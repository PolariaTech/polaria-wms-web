# ADR-005 — Excepción temporal de `npm audit` por `xlsx`

## Estado

Aceptado (Score-10 P1). Revisión obligatoria al retirar `xlsx` del árbol de producción.

## Contexto

`polaria-wms-web` aún usa `xlsx` en extractores de pedido, impresión batch y catálogo. El paquete tiene vulnerabilidades **high** sin fix en el registry (`GHSA-4r6h-8v6p-xvw6`, `GHSA-5pgg-2g8v-p4x9`). El resto del stack ya migró lecturas Excel a `exceljs` donde fue posible (p. ej. compradores).

## Decisión

1. El job `dependency-audit` de CI **bloquea** severidad high/critical, igual que `polaria-wms-api`.
2. La única excepción documentada es el paquete de producción `xlsx` mientras existan los tres consumidores listados abajo.
3. Cualquier otra high/critical **falla el PR** (sin `continue-on-error`).
4. Trivy de imagen falla con CRITICAL con corrección (`ignore-unfixed: true`), misma política que API.

## Consumidores pendientes de migrar a exceljs

- `src/modules/sales/ordenes/ai/file-extractors.ts`
- `src/modules/sales/ordenes/print-batch/excel-a-pdf.ts`
- `src/modules/admin-panel/catalogo/utils/catalogo-excel-import.ts`

## Consecuencias

- Score ≥9 / P1 audit queda cumplido vía ADR único + gate real.
- Al eliminar `xlsx` de `package.json`, borrar esta ADR o marcarla Obsoleta y quitar el allowlist del script de CI.
