import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { normalizeIdOrdenTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import type {
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoCapturaRow,
} from "./orden-surtido.types";

interface CapturaDbRow {
  id_captura: string;
  id_orden_venta: string;
  id_orden_trabajo?: string | null;
  codigo_cuenta: string;
  url_foto: string | null;
  payload: OrdenSurtidoCapturaPayload | null;
  modelo: string | null;
  updated_at: string;
}

function coercePayload(
  raw: OrdenSurtidoCapturaPayload | null | undefined,
): OrdenSurtidoCapturaPayload {
  return {
    campos: raw?.campos ?? {},
    checks: raw?.checks ?? {},
    lineas: Array.isArray(raw?.lineas) ? raw.lineas : [],
    observacionesIa: raw?.observacionesIa ?? null,
    precisionEstimada: raw?.precisionEstimada ?? null,
  };
}

function mapRow(row: CapturaDbRow): OrdenSurtidoCapturaRow {
  return {
    idCaptura: row.id_captura,
    idOrdenVenta: row.id_orden_venta,
    idOrdenTrabajo: normalizeIdOrdenTrabajo(row.id_orden_trabajo),
    codigoCuenta: row.codigo_cuenta,
    urlFoto: row.url_foto,
    payload: coercePayload(row.payload),
    modelo: row.modelo,
    updatedAt: row.updated_at,
  };
}

/** Capturas de surtido (payload IA) de una OV — para PDF actualizado. */
export async function listOrdenSurtidoCapturasClient(input: {
  codigoCuenta: string;
  idOrdenVenta: string;
}): Promise<OrdenSurtidoCapturaRow[]> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idOrdenVenta = input.idOrdenVenta.trim();
  if (!idOrdenVenta) return [];

  const rows = await runDomainQuery<CapturaDbRow[]>((client) => {
    const query = client
      .from("orden_venta_surtido_captura")
      .select(
        "id_captura,id_orden_venta,id_orden_trabajo,codigo_cuenta,url_foto,payload,modelo,updated_at",
      )
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_orden_venta", idOrdenVenta)
      .order("updated_at", { ascending: false })
      .limit(100);

    return query as unknown as Promise<{
      data: CapturaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapRow);
}
