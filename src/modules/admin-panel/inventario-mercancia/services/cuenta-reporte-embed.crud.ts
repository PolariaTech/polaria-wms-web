import {
  normalizeEmbedUrl,
  extractReporteIdFromEmbedUrl,
  resolveReporteIdFromEmbedUrl,
} from "./reporte-embed-url";
import { mapEmbedRow } from "./cuenta-reporte-embed.map";
import { requireTenantFrom, tenantFrom } from "./cuenta-reporte-embed.tenant";
import {
  EMBED_SELECT,
  type CuentaReporteEmbedDbRow,
  type CuentaReporteEmbedRow,
} from "./cuenta-reporte-embed.types";

/** Reportes activos de la cuenta (uno o varios). */
export async function listCuentaReporteEmbeds(
  codigoCuenta: string,
): Promise<CuentaReporteEmbedRow[]> {
  const from = await tenantFrom(codigoCuenta);
  if (!from) return [];

  const { data, error } = await from("cuenta_reporte_embed")
    .select(EMBED_SELECT)
    .eq("codigo_cuenta", codigoCuenta.trim())
    .eq("esta_activo", true)
    .order("descripcion", { ascending: true });

  if (error || !data?.length) return [];

  return (data as CuentaReporteEmbedDbRow[])
    .map(mapEmbedRow)
    .filter((row) => Boolean(row.embedUrl));
}

/** Lista todos los reportes de la cuenta para el administrador. */
export async function listCuentaReporteEmbedsAdmin(
  codigoCuenta: string,
): Promise<CuentaReporteEmbedRow[]> {
  const from = requireTenantFrom(await tenantFrom(codigoCuenta));
  const { data, error } = await from("cuenta_reporte_embed")
    .select(EMBED_SELECT)
    .eq("codigo_cuenta", codigoCuenta.trim())
    .order("descripcion", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar los reportes.");
  }

  return ((data as CuentaReporteEmbedDbRow[]) ?? [])
    .map(mapEmbedRow)
    .filter((row) => Boolean(row.embedUrl));
}

export async function createCuentaReporteEmbed(input: {
  codigoCuenta: string;
  descripcion: string;
  embedUrl: string;
}): Promise<CuentaReporteEmbedRow> {
  const descripcion = input.descripcion.trim();
  if (!descripcion) {
    throw new Error("La descripción del reporte es obligatoria.");
  }

  const embedUrl = normalizeEmbedUrl(input.embedUrl);
  const reporteId = resolveReporteIdFromEmbedUrl(embedUrl);
  const from = requireTenantFrom(await tenantFrom(input.codigoCuenta));

  const { data, error } = await from("cuenta_reporte_embed")
    .insert({
      codigo_cuenta: input.codigoCuenta.trim(),
      descripcion,
      embed_url: embedUrl,
      reporte_id: reporteId,
      esta_activo: true,
    })
    .select(EMBED_SELECT)
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("Esta cuenta ya tiene un reporte con ese identificador.");
    }
    throw new Error("No se pudo guardar el reporte.");
  }

  return mapEmbedRow(data as CuentaReporteEmbedDbRow);
}

export async function updateCuentaReporteEmbed(input: {
  codigoCuenta: string;
  idCuentaReporteEmbed: string;
  descripcion: string;
  embedUrl: string;
  estaActivo: boolean;
}): Promise<CuentaReporteEmbedRow> {
  const descripcion = input.descripcion.trim();
  if (!descripcion) {
    throw new Error("La descripción del reporte es obligatoria.");
  }

  const embedUrl = normalizeEmbedUrl(input.embedUrl);
  const from = requireTenantFrom(await tenantFrom(input.codigoCuenta));
  const id = input.idCuentaReporteEmbed.trim();

  const { data: current, error: currentError } = await from(
    "cuenta_reporte_embed",
  )
    .select(EMBED_SELECT)
    .eq("codigo_cuenta", input.codigoCuenta.trim())
    .eq("id_cuenta_reporte_embed", id)
    .maybeSingle();

  if (currentError || !current) {
    throw new Error("No se encontró el reporte.");
  }

  const currentRow = current as CuentaReporteEmbedDbRow;
  const extractedId = extractReporteIdFromEmbedUrl(embedUrl);
  const reporteId =
    extractedId && extractedId !== currentRow.reporte_id
      ? extractedId
      : currentRow.reporte_id;

  const { data, error } = await from("cuenta_reporte_embed")
    .update({
      descripcion,
      embed_url: embedUrl,
      reporte_id: reporteId,
      esta_activo: input.estaActivo,
    })
    .eq("codigo_cuenta", input.codigoCuenta.trim())
    .eq("id_cuenta_reporte_embed", id)
    .select(EMBED_SELECT)
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("Esta cuenta ya tiene un reporte con ese identificador.");
    }
    throw new Error("No se pudo actualizar el reporte.");
  }

  return mapEmbedRow(data as CuentaReporteEmbedDbRow);
}

/** URL activa de un embed concreto, o null si no aplica. */
export async function getCuentaReporteEmbedUrl(
  codigoCuenta: string,
  idCuentaReporteEmbed: string,
): Promise<string | null> {
  const from = await tenantFrom(codigoCuenta);
  if (!from) return null;

  const { data, error } = await from("cuenta_reporte_embed")
    .select("embed_url")
    .eq("codigo_cuenta", codigoCuenta.trim())
    .eq("id_cuenta_reporte_embed", idCuentaReporteEmbed.trim())
    .eq("esta_activo", true)
    .maybeSingle();

  if (error || !data?.embed_url?.trim()) return null;
  return (data.embed_url as string).trim();
}