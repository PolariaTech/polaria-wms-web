# ADR-005 — `xlsx` desde el CDN de SheetJS y fin de la excepción de `npm audit`

## Estado

Cerrada (reemplaza la excepción temporal aceptada en Score-10 P1). Ya no existe ninguna excepción en el audit.

## Contexto

`polaria-wms-web` usa `xlsx` en extractores de pedido, impresión batch y catálogo. La última versión publicada en el registro npm (0.18.5) tiene vulnerabilidades **high** sin parche en el registro (`GHSA-4r6h-8v6p-xvw6`, `GHSA-5pgg-2g8v-p4x9`). SheetJS publica las versiones corregidas solo en su propio CDN.

`exceljs`, que usa la API (POL-434), no lee `.xls` y obliga a pasar el código a asíncrono; en la web hay cuatro puntos de la UI que aceptan `.xls`. Por eso no se migró.

## Decisión

1. `xlsx` se instala desde `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (0.20.3, versión con las dos vulnerabilidades corregidas). El código no cambia y se conserva el soporte de `.xls`.
2. El job `dependency-audit` bloquea severidad high y critical **sin ninguna excepción**, la misma barra que `polaria-wms-api`.
3. Limitación conocida: `npm audit` no analiza dependencias que vienen de una URL, así que no ve `xlsx`. Para no dejar un punto ciego, `scripts/ci-dependency-audit.mjs` valida también el lockfile y falla si `xlsx` baja de 0.20.3, se resuelve desde un origen distinto de `https://cdn.sheetjs.com/` o pierde su `integrity`.
4. Trivy de imagen falla con CRITICAL con corrección (`ignore-unfixed: true`), misma política que la API.

## Consecuencias

- El audit ya no tiene excepciones ni depende de este documento para ejecutarse.
- Quien suba la versión de `xlsx` debe actualizar `XLSX_VERSION_MINIMA` si quiere subir el mínimo exigido.
- Los avisos nuevos de `xlsx` no los detectará `npm audit`: hay que revisar el sitio de SheetJS al actualizar dependencias.
- Si en el futuro se migra a `exceljs` o SheetJS vuelve a publicar en npm, esta decisión se puede retirar junto con la comprobación del lockfile.
