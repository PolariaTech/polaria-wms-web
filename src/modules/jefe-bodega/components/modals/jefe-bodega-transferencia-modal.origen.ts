import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { OrdenTrabajoApiRow } from "@/modules/operations";
import type { ProcesamientoSlotEnriquecimiento } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-procesamiento-slot";
import { buildRolDevolucionObservacion } from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import { buildProcesamientoSolicitudRef } from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import { resolveUbicacionOrigenPrimarioDesdeOt } from "../../utils/transferencia-origen-primario";
import type { JefeBodegaSlotPickerOption } from "./JefeBodegaSlotPickerModal";
import type {
  OrigenMeta,
  OrigenRol,
  OrigenZona,
} from "./jefe-bodega-transferencia-modal.types";

interface ResolveOrigenSeleccionParams {
  option: JefeBodegaSlotPickerOption;
  enriquecimientoProc: Map<string, ProcesamientoSlotEnriquecimiento>;
  productoBySolicitud: Map<string, { idPrimario: string; idSecundario: string }>;
  ordenes: OrdenTrabajoApiRow[];
  almacenIds: Set<string>;
  warehouseStock: WarehouseStateRow[];
}

export function resolveOrigenSeleccion({
  option,
  enriquecimientoProc,
  productoBySolicitud,
  ordenes,
  almacenIds,
  warehouseStock,
}: ResolveOrigenSeleccionParams): {
  idUbicacion: string;
  destinoFijoId: string | null;
  origenMeta: OrigenMeta;
} {
  const parts = option.id.split(":");
  const zona: OrigenZona =
    parts[0] === "proc" ? "procesamiento" : "almacenamiento";
  const idUbicacion = parts[1] ?? option.id;
  const rol = (parts[2] ?? "normal") as OrigenRol;

  const meta = enriquecimientoProc.get(idUbicacion);
  const products = meta
    ? productoBySolicitud.get(meta.idSolicitud)
    : undefined;

  let destinoFijoId: string | null = null;
  if (zona === "procesamiento" && rol === "sobrante" && meta) {
    destinoFijoId = resolveUbicacionOrigenPrimarioDesdeOt({
      idUbicacionProcesamiento: idUbicacion,
      idSolicitud: meta.idSolicitud,
      idProductoPrimario: products?.idPrimario ?? null,
      ordenes,
      almacenIds,
      warehouseRows: warehouseStock,
    });
  }

  return {
    idUbicacion,
    destinoFijoId,
    origenMeta: {
      idUbicacion,
      zona,
      rol,
      idSolicitud: meta?.idSolicitud ?? null,
      idProducto:
        rol === "sobrante"
          ? (products?.idPrimario ?? null)
          : rol === "procesado"
            ? (products?.idSecundario ?? null)
            : null,
      cantidad:
        rol === "sobrante"
          ? (meta?.sobranteKg ?? null)
          : rol === "procesado"
            ? (meta?.unidadesSecundario ?? null)
            : null,
    },
  };
}

export function buildTransferenciaObservaciones(
  origenMeta: OrigenMeta,
): string | undefined {
  const observacionParts: string[] = [];
  if (origenMeta.rol === "sobrante" || origenMeta.rol === "procesado") {
    observacionParts.push(
      buildRolDevolucionObservacion(
        origenMeta.rol === "sobrante" ? "desperdicio" : "procesado",
      ),
    );
  }
  if (origenMeta.idSolicitud) {
    observacionParts.push(
      buildProcesamientoSolicitudRef(origenMeta.idSolicitud),
    );
  }
  return observacionParts.length > 0 ? observacionParts.join("|") : undefined;
}
