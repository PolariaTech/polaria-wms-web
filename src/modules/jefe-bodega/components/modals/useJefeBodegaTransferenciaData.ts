import { useEffect, useState } from "react";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import { listOrdenesTrabajoApi } from "@/modules/operations";
import type { OrdenTrabajoApiRow } from "@/modules/operations";
import {
  listSolicitudesProcesamiento,
  listSolicitudesProcesamientoOperador,
} from "@/modules/processing";
import type { ProcesamientoSlotEnriquecimiento } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-procesamiento-slot";
import { buildProcesamientoEnriquecimientoByUbicacion } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-procesamiento-slot";

interface UseJefeBodegaTransferenciaDataParams {
  open: boolean;
  idBodega: string | null;
  codigoCuenta: string | null;
}

export function useJefeBodegaTransferenciaData({
  open,
  idBodega,
  codigoCuenta,
}: UseJefeBodegaTransferenciaDataParams) {
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStateRow[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenTrabajoApiRow[]>([]);
  const [enriquecimientoProc, setEnriquecimientoProc] = useState(
    () => new Map<string, ProcesamientoSlotEnriquecimiento>(),
  );
  const [productoBySolicitud, setProductoBySolicitud] = useState(
    () =>
      new Map<string, { idPrimario: string; idSecundario: string }>(),
  );
  const [loadingStock, setLoadingStock] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadData() {
      if (!idBodega || !codigoCuenta) {
        if (!cancelled) {
          setWarehouseStock([]);
          setOrdenes([]);
          setEnriquecimientoProc(new Map());
          setProductoBySolicitud(new Map());
        }
        return;
      }

      setLoadingStock(true);
      try {
        const [rows, ots, solicitudesOperador, solicitudesDb] =
          await Promise.all([
            listWarehouseState({ idBodega, codigoCuenta, limit: 500 }),
            listOrdenesTrabajoApi({ codigoCuenta, idBodega }).catch(() => []),
            listSolicitudesProcesamientoOperador({
              codigoCuenta,
              idBodega,
            }).catch(() => []),
            listSolicitudesProcesamiento({ codigoCuenta, idBodega }).catch(
              () => [],
            ),
          ]);

        if (cancelled) return;

        setWarehouseStock(rows);
        setOrdenes(ots);
        setEnriquecimientoProc(
          buildProcesamientoEnriquecimientoByUbicacion({
            solicitudesOperador,
            solicitudesDb,
            ordenes: ots,
            warehouseRows: rows,
          }),
        );
        setProductoBySolicitud(
          new Map(
            solicitudesDb.map((row) => [
              row.id_solicitud_procesamiento,
              {
                idPrimario: row.id_producto_primario,
                idSecundario: row.id_producto_secundario,
              },
            ]),
          ),
        );
      } catch {
        if (!cancelled) {
          setWarehouseStock([]);
          setOrdenes([]);
          setEnriquecimientoProc(new Map());
          setProductoBySolicitud(new Map());
        }
      } finally {
        if (!cancelled) setLoadingStock(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [open, idBodega, codigoCuenta]);

  return {
    warehouseStock,
    ordenes,
    enriquecimientoProc,
    productoBySolicitud,
    loadingStock,
  };
}
