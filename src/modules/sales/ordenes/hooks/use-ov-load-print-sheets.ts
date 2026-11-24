import { useCallback } from "react";
import { getOrdenVentaDetalle } from "../../shared/services/sales.service";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { RunScoped } from "../components/pages/ov-impresion-feedback";
import { mapOrdenVentaToAlmacenPrintSheets } from "../print/map-orden-tarea-almacen";
import { applySurtidoCapturasToPrintSheets } from "../surtido/apply-surtido-to-print";
import { listOrdenSurtidoCapturasClient } from "../surtido/list-orden-surtido-capturas.client";

/** Arma las hojas de impresión de una OV: detalle + capturas de surtido (ambos opcionales). */
export function useOvLoadPrintSheets({
  codigoCuenta,
  runScoped,
  zonaHoraria,
}: {
  codigoCuenta: string | null;
  runScoped: RunScoped;
  zonaHoraria: string;
}) {
  return useCallback(
    async (row: OrdenVentaOperadorRow) => {
      let detalle = null;
      if (codigoCuenta) {
        try {
          detalle = await runScoped(() =>
            getOrdenVentaDetalle({
              codigoCuenta,
              idOrdenVenta: row.idOrdenVenta,
            }),
          );
        } catch {
          detalle = null;
        }
      }

      const sheets = mapOrdenVentaToAlmacenPrintSheets({
        listRow: row,
        detalle,
        timeZone: zonaHoraria,
      });

      if (!codigoCuenta) return sheets;

      try {
        const capturas = await runScoped(() =>
          listOrdenSurtidoCapturasClient({
            codigoCuenta,
            idOrdenVenta: row.idOrdenVenta,
          }),
        );
        return applySurtidoCapturasToPrintSheets(sheets, capturas);
      } catch {
        return sheets;
      }
    },
    [codigoCuenta, runScoped, zonaHoraria],
  );
}
