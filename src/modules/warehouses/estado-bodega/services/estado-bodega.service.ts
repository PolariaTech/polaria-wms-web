import {
  requireIdBodega,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import { mapEstadoBodegaLayout } from "../utils/estado-bodega-mapper";
import type {
  EstadoBodegaLayoutView,
  UbicacionEstadoBodegaDbRow,
} from "../types/estado-bodega.types";

const UBICACION_ESTADO_COLUMNS =
  "id_ubicacion,codigo,estado_slot,tipo_ubicacion(codigo,es_recepcion,es_almacenamiento,es_picking)";

export async function listUbicacionesEstadoBodega(
  idBodega: string,
): Promise<UbicacionEstadoBodegaDbRow[]> {
  const resolvedId = requireIdBodega(idBodega);

  return runDomainQuery<UbicacionEstadoBodegaDbRow[]>((client) => {
    const query = client
      .from("ubicacion")
      .select(UBICACION_ESTADO_COLUMNS)
      .eq("id_bodega", resolvedId)
      .eq("esta_activa", true)
      .order("codigo", { ascending: true });

    return query as unknown as Promise<{
      data: UbicacionEstadoBodegaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function getEstadoBodegaLayout(params: {
  idBodega: string;
  codigoCuenta?: string | null;
}): Promise<EstadoBodegaLayoutView> {
  const idBodega = requireIdBodega(params.idBodega);

  const [ubicaciones, warehouseRows] = await Promise.all([
    listUbicacionesEstadoBodega(idBodega),
    listWarehouseState({
      idBodega,
      codigoCuenta: params.codigoCuenta ?? undefined,
      limit: 500,
    }),
  ]);

  return mapEstadoBodegaLayout(ubicaciones, warehouseRows);
}
