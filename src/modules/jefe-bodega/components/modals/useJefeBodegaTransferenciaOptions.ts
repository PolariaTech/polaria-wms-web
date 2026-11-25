import { useMemo } from "react";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { ProcesamientoSlotEnriquecimiento } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-procesamiento-slot";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { JefeBodegaSlotPickerOption } from "./JefeBodegaSlotPickerModal";
import {
  buildOrigenAlmacenOptions,
  buildOrigenProcesamientoOptions,
  buildTransferenciaDestinoOptions,
  buildTransferenciaSlotNumberById,
} from "./jefe-bodega-transferencia-modal.options";
import type { OrigenMeta } from "./jefe-bodega-transferencia-modal.types";

interface UseJefeBodegaTransferenciaOptionsParams {
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  ubicacionesProcesamiento: UbicacionEstadoBodegaDbRow[];
  bloqueadas: Set<string>;
  warehouseStock: WarehouseStateRow[];
  enriquecimientoProc: Map<string, ProcesamientoSlotEnriquecimiento>;
  origenMeta: OrigenMeta | null;
}

export function useJefeBodegaTransferenciaOptions({
  ubicacionesAlmacen,
  ubicacionesProcesamiento,
  bloqueadas,
  warehouseStock,
  enriquecimientoProc,
  origenMeta,
}: UseJefeBodegaTransferenciaOptionsParams) {
  const almacenIds = useMemo(
    () => new Set(ubicacionesAlmacen.map((u) => u.id_ubicacion)),
    [ubicacionesAlmacen],
  );

  const procIds = useMemo(
    () => new Set(ubicacionesProcesamiento.map((u) => u.id_ubicacion)),
    [ubicacionesProcesamiento],
  );

  const ubicacionesDisponiblesIds = useMemo(
    () =>
      new Set(
        ubicacionesAlmacen
          .filter((u) => !bloqueadas.has(u.id_ubicacion))
          .map((u) => u.id_ubicacion),
      ),
    [ubicacionesAlmacen, bloqueadas],
  );

  const codigoByUbicacion = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of [...ubicacionesAlmacen, ...ubicacionesProcesamiento]) {
      map.set(u.id_ubicacion, u.codigo);
    }
    return map;
  }, [ubicacionesAlmacen, ubicacionesProcesamiento]);

  const slotNumberById = useMemo(
    () =>
      buildTransferenciaSlotNumberById(ubicacionesAlmacen, ubicacionesProcesamiento),
    [ubicacionesAlmacen, ubicacionesProcesamiento],
  );

  const origenAlmacenOptions = useMemo<JefeBodegaSlotPickerOption[]>(
    () =>
      buildOrigenAlmacenOptions({
        warehouseStock,
        almacenIds,
        ubicacionesDisponiblesIds,
        codigoByUbicacion,
        slotNumberById,
      }),
    [
      warehouseStock,
      almacenIds,
      ubicacionesDisponiblesIds,
      codigoByUbicacion,
      slotNumberById,
    ],
  );

  const origenProcesamientoOptions = useMemo<JefeBodegaSlotPickerOption[]>(
    () =>
      buildOrigenProcesamientoOptions({
        enriquecimientoProc,
        procIds,
        bloqueadas,
        codigoByUbicacion,
        slotNumberById,
        warehouseStock,
      }),
    [
      enriquecimientoProc,
      procIds,
      bloqueadas,
      codigoByUbicacion,
      slotNumberById,
      warehouseStock,
    ],
  );

  const destinoOptions = useMemo<JefeBodegaSlotPickerOption[]>(
    () => buildTransferenciaDestinoOptions(ubicacionesAlmacen, origenMeta),
    [ubicacionesAlmacen, origenMeta],
  );

  return {
    almacenIds,
    codigoByUbicacion,
    origenAlmacenOptions,
    origenProcesamientoOptions,
    destinoOptions,
  };
}
