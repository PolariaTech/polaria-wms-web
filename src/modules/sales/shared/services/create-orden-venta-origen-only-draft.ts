import { runDomainMutation } from "@/lib/supabase/domain-query";
import type { OrdenVentaRow } from "../types/sales.types";

const ORDEN_VENTA_COLUMNS =
  "id_orden_venta,codigo_cuenta,id_bodega,id_cliente,id_comprador,id_planta,id_creador,id_bodega_destino,codigo,estado,fecha_pedido,observaciones,created_at,updated_at,estado_desde";

/**
 * REQ-199: primer avance tras leer archivo/mensaje, aún sin cliente ni líneas.
 */
export async function insertOrdenVentaOrigenOnlyDraft(input: {
  codigoCuenta: string;
  idBodega: string;
  idCliente: string;
  idComprador: string;
  idCreador: string | null;
  idBodegaDestino: string | null;
  capture: Record<string, string | null | unknown>;
  observaciones: string | null;
}): Promise<OrdenVentaRow> {
  return runDomainMutation<OrdenVentaRow>((client) => {
    const query = client
      .from("orden_venta")
      .insert({
        codigo_cuenta: input.codigoCuenta,
        id_bodega: input.idBodega,
        id_cliente: input.idCliente,
        id_comprador: input.idComprador || null,
        id_creador: input.idCreador,
        id_bodega_destino: input.idBodegaDestino,
        ...input.capture,
        codigo: "",
        estado: "por_confirmar",
        observaciones: input.observaciones,
      })
      .select(ORDEN_VENTA_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: OrdenVentaRow | null;
      error: { message: string } | null;
    }>;
  });
}

export function isOrigenOnlyFirstDraft(params: {
  guardarAvance: boolean;
  idOrdenVentaExistente: string;
  tieneOrigenCaptura: boolean;
}): boolean {
  return (
    params.guardarAvance &&
    !params.idOrdenVentaExistente &&
    params.tieneOrigenCaptura
  );
}
