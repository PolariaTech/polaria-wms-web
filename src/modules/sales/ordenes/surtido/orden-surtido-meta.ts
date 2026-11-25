import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeIdOrdenTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import { adminFrom, resolveOrdenAdminContext } from "./orden-surtido-admin";

export async function getOrdenMetaPublica(
  idOrdenVenta: string,
  idOrdenTrabajo?: string | null,
): Promise<{
  idOrdenVenta: string;
  codigoCuenta: string;
  folio: string;
  tieneCaptura: boolean;
  idOrdenTrabajo: string;
} | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return null;

  const ot = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  let capturaQuery = adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura",
  )
    .select("id_captura")
    .eq("id_orden_venta", idOrdenVenta)
    .limit(1);

  if (ot) {
    capturaQuery = capturaQuery.eq("id_orden_trabajo", ot);
  }

  const { data: capturaRows } = await capturaQuery;
  const captura = Array.isArray(capturaRows) ? capturaRows[0] : capturaRows;

  return {
    idOrdenVenta,
    codigoCuenta: ctx.codigoCuenta,
    folio: ctx.codigo,
    tieneCaptura: Boolean(captura?.id_captura),
    idOrdenTrabajo: ot,
  };
}