import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveTenantSchemaForCuenta } from "@/modules/sales/shared/services/sales-catalog.server";
import { normalizeIdOrdenTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import { adminFrom, resolveOrdenAdminContext } from "./orden-surtido-admin";
import {
  CAPTURA_SELECT,
  type CapturaDbRow,
  mapRow,
} from "./orden-surtido-captura-mappers";
import type {
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoCapturaRow,
} from "./orden-surtido.types";

async function appendOrdenSurtidoCapturaFoto(input: {
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  codigoCuenta: string;
  urlFoto: string;
  schemaName: string | null;
}): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const { error } = await adminFrom(
    admin,
    input.schemaName,
    "orden_venta_surtido_captura_foto",
  ).insert({
    id_orden_venta: input.idOrdenVenta,
    id_orden_trabajo: input.idOrdenTrabajo,
    codigo_cuenta: input.codigoCuenta,
    url_foto: input.urlFoto,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  try {
    const { recordOrdenVentaLogServer } = await import(
      "../services/orden-venta-log.server"
    );
    const label = input.idOrdenTrabajo.trim() || "OT";
    await recordOrdenVentaLogServer({
      idOrdenVenta: input.idOrdenVenta,
      codigoCuenta: input.codigoCuenta,
      accion: "actualizacion",
      mensaje: `Foto de alistamiento / surtido capturada en la orden de trabajo.`,
      idOrdenTrabajo: input.idOrdenTrabajo || null,
      payloadExtra: {
        tipo: "foto_surtido",
        idOrdenTrabajo: label,
        urlFoto: input.urlFoto,
      },
    });
  } catch (logError) {
    console.warn(
      "[surtido] log foto falló:",
      logError instanceof Error ? logError.message : logError,
    );
  }
}

export async function upsertOrdenSurtidoCaptura(input: {
  idOrdenVenta: string;
  idOrdenTrabajo?: string | null;
  codigoCuenta: string;
  urlFoto: string | null;
  payload: OrdenSurtidoCapturaPayload;
  modelo: string;
}): Promise<OrdenSurtidoCapturaRow> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, input.idOrdenVenta);
  const schemaName =
    ctx?.schemaName ??
    (await resolveTenantSchemaForCuenta(admin, input.codigoCuenta));

  const idOrdenTrabajo = normalizeIdOrdenTrabajo(input.idOrdenTrabajo);

  const { data, error } = await adminFrom(
    admin,
    schemaName,
    "orden_venta_surtido_captura",
  )
    .upsert(
      {
        id_orden_venta: input.idOrdenVenta,
        id_orden_trabajo: idOrdenTrabajo,
        codigo_cuenta: input.codigoCuenta,
        url_foto: input.urlFoto,
        payload: input.payload,
        modelo: input.modelo,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id_orden_venta,id_orden_trabajo" },
    )
    .select(CAPTURA_SELECT)
    .single();

  if (error) throw new Error(error.message);
  const row = mapRow(data as CapturaDbRow);

  const urlFoto = input.urlFoto?.trim() ?? "";
  if (urlFoto) {
    try {
      await appendOrdenSurtidoCapturaFoto({
        idOrdenVenta: input.idOrdenVenta,
        idOrdenTrabajo,
        codigoCuenta: input.codigoCuenta,
        urlFoto,
        schemaName,
      });
    } catch (fotoError) {
      console.error(
        "[surtido] append historial foto falló:",
        fotoError instanceof Error ? fotoError.message : fotoError,
      );
    }
  }

  return row;
}