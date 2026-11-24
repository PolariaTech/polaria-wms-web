import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  normalizeIdOrdenTrabajo,
  parseIdOrdenTrabajoFields,
  parseOrigenCorreoJson,
  type OrdenTrabajoHija,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { adminFrom, resolveOrdenAdminContext } from "./orden-surtido-admin";
import {
  FOTO_SELECT,
  type CapturaFotoDbRow,
  mapFotoRow,
} from "./orden-surtido-captura-mappers";
import type {
  OrdenSurtidoCapturaFotoRow,
  OrdenSurtidoCapturaOtConFotos,
} from "./orden-surtido.types";

/** OTs de una OV que tienen al menos una foto en el historial. */
export async function listOrdenSurtidoCapturaOtsConFotos(
  idOrdenVenta: string,
): Promise<OrdenSurtidoCapturaOtConFotos[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return [];

  const { data, error } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura_foto",
  )
    .select(FOTO_SELECT)
    .eq("id_orden_venta", idOrdenVenta)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const hijasById = new Map<string, OrdenTrabajoHija>();
  try {
    const { data: ordenRow } = await adminFrom(
      admin,
      ctx.schemaName,
      "orden_venta",
    )
      .select("origen_correo")
      .eq("id_orden_venta", idOrdenVenta)
      .maybeSingle();
    const hijas = groupOrigenCorreoToOrdenesTrabajo(
      parseOrigenCorreoJson(
        (ordenRow as { origen_correo?: unknown } | null)?.origen_correo,
      ),
    );
    for (const hija of hijas) {
      hijasById.set(hija.id, hija);
    }
  } catch {
    // Sin origen_correo: se usa parseo de la clave OT.
  }

  const byOt = new Map<string, OrdenSurtidoCapturaOtConFotos>();
  for (const raw of data ?? []) {
    const foto = mapFotoRow(raw as CapturaFotoDbRow);
    const existing = byOt.get(foto.idOrdenTrabajo);
    if (!existing) {
      const hija = hijasById.get(foto.idOrdenTrabajo);
      const parsed = parseIdOrdenTrabajoFields(foto.idOrdenTrabajo);
      byOt.set(foto.idOrdenTrabajo, {
        idOrdenTrabajo: foto.idOrdenTrabajo,
        totalFotos: 1,
        ultimaAt: foto.createdAt,
        previewUrl: foto.urlFoto,
        label: hija?.label || parsed.label,
        numeroPedido: hija?.numeroPedido || parsed.numeroPedido,
        centroConsumo: hija?.almacen || parsed.centroConsumo,
      });
      continue;
    }
    existing.totalFotos += 1;
  }

  return [...byOt.values()].sort((a, b) =>
    b.ultimaAt.localeCompare(a.ultimaAt),
  );
}

/** Historial de fotos de una OT concreta (incluye reemplazos). */
export async function listOrdenSurtidoCapturaFotos(
  idOrdenVenta: string,
  idOrdenTrabajo?: string | null,
): Promise<OrdenSurtidoCapturaFotoRow[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return [];

  const ot = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  const { data, error } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura_foto",
  )
    .select(FOTO_SELECT)
    .eq("id_orden_venta", idOrdenVenta)
    .eq("id_orden_trabajo", ot)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapFotoRow(row as CapturaFotoDbRow));
}