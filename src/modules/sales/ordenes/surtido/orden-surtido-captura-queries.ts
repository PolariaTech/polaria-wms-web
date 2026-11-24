import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeIdOrdenTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import { adminFrom, resolveOrdenAdminContext } from "./orden-surtido-admin";
import {
  CAPTURA_SELECT,
  type CapturaDbRow,
  mapRow,
} from "./orden-surtido-captura-mappers";
import type { OrdenSurtidoCapturaRow } from "./orden-surtido.types";

export async function getOrdenSurtidoCaptura(
  idOrdenVenta: string,
  idOrdenTrabajo?: string | null,
): Promise<OrdenSurtidoCapturaRow | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return null;

  const ot = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  const query = adminFrom(admin, ctx.schemaName, "orden_venta_surtido_captura")
    .select(CAPTURA_SELECT)
    .eq("id_orden_venta", idOrdenVenta)
    .eq("id_orden_trabajo", ot);

  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return mapRow(data as CapturaDbRow);

  if (ot) {
    const { data: legacy, error: legacyError } = await adminFrom(
      admin,
      ctx.schemaName,
      "orden_venta_surtido_captura",
    )
      .select(CAPTURA_SELECT)
      .eq("id_orden_venta", idOrdenVenta)
      .eq("id_orden_trabajo", "")
      .maybeSingle();
    if (legacyError) throw new Error(legacyError.message);
    if (legacy) return mapRow(legacy as CapturaDbRow);
  }

  return null;
}

export async function listOrdenSurtidoCapturas(
  idOrdenVenta: string,
): Promise<OrdenSurtidoCapturaRow[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return [];

  const { data, error } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura",
  )
    .select(CAPTURA_SELECT)
    .eq("id_orden_venta", idOrdenVenta)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as CapturaDbRow));
}