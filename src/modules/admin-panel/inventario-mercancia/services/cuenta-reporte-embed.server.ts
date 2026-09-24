import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  normalizeEmbedUrl,
  extractReporteIdFromEmbedUrl,
  resolveReporteIdFromEmbedUrl,
} from "./reporte-embed-url";

export interface EmbedReportSession {
  codigoCuenta: string;
  idUsuario: string;
  idRol: string | null;
}

export interface CuentaReporteEmbedRow {
  idCuentaReporteEmbed: string;
  codigoCuenta: string;
  descripcion: string | null;
  reporteId: string;
  embedUrl: string;
  estaActivo: boolean;
}

interface UsuarioCuentaRow {
  id_usuario: string;
  codigo_cuenta: string | null;
  id_rol: string | null;
}

interface CuentaReporteEmbedDbRow {
  id_cuenta_reporte_embed: string;
  codigo_cuenta: string;
  descripcion: string | null;
  reporte_id: string | null;
  embed_url: string;
  esta_activo?: boolean | null;
}

type TenantFrom = ReturnType<SupabaseClient["from"]>;

async function resolveTenantSchemaForCuenta(
  admin: SupabaseClient,
  codigoCuenta: string,
): Promise<string | null> {
  const codigo = codigoCuenta.trim();
  if (!codigo) return null;

  const { data: publicCuenta } = await admin
    .from("cuenta")
    .select("codigo_cuenta,codigo_empresa")
    .eq("codigo_cuenta", codigo)
    .limit(1)
    .maybeSingle();

  if (publicCuenta?.codigo_empresa) {
    const { data: empresa } = await admin
      .from("empresa")
      .select("schema_name")
      .eq("codigo_empresa", publicCuenta.codigo_empresa)
      .limit(1)
      .maybeSingle();

    return empresa?.schema_name?.trim() || null;
  }

  const { data: empresas } = await admin
    .from("empresa")
    .select("schema_name")
    .not("schema_name", "is", null)
    .limit(500);

  for (const empresa of empresas ?? []) {
    const schemaName = empresa.schema_name?.trim();
    if (!schemaName) continue;

    const { data, error } = await admin
      .schema(schemaName)
      .from("cuenta")
      .select("codigo_cuenta")
      .eq("codigo_cuenta", codigo)
      .limit(1)
      .maybeSingle();

    if (error) continue;
    if (data?.codigo_cuenta) return schemaName;
  }

  return null;
}

async function tenantFrom(
  codigoCuenta: string,
): Promise<((table: string) => TenantFrom) | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const schemaName = await resolveTenantSchemaForCuenta(client, codigoCuenta);
  return (table: string) =>
    schemaName
      ? (client.schema(schemaName).from(table) as TenantFrom)
      : client.from(table);
}

function requireTenantFrom(
  from: ((table: string) => TenantFrom) | null,
): (table: string) => TenantFrom {
  if (!from) {
    throw new Error("No hay cliente de base de datos.");
  }
  return from;
}

/** Resuelve sesión WMS desde el JWT (Supabase Auth + tabla usuario). */
export async function resolveEmbedReportSession(
  accessToken: string,
): Promise<EmbedReportSession | null> {
  const token = accessToken.trim();
  if (!token) return null;

  const client = getSupabaseAdminClient();
  if (!client) return null;

  const { data: authData, error: authError } =
    await client.auth.getUser(token);
  if (authError || !authData.user?.id) return null;

  const { data: usuario, error: usuarioError } = await client
    .from("usuario")
    .select("id_usuario,codigo_cuenta,id_rol")
    .eq("id_auth", authData.user.id)
    .eq("esta_activo", true)
    .maybeSingle();

  if (usuarioError || !usuario) return null;

  const row = usuario as UsuarioCuentaRow;
  const codigoCuenta = row.codigo_cuenta?.trim();
  if (!codigoCuenta || !row.id_usuario) return null;

  return {
    codigoCuenta,
    idUsuario: row.id_usuario,
    idRol: row.id_rol?.trim() || null,
  };
}

function mapEmbedRow(row: CuentaReporteEmbedDbRow): CuentaReporteEmbedRow {
  return {
    idCuentaReporteEmbed: row.id_cuenta_reporte_embed,
    codigoCuenta: row.codigo_cuenta,
    descripcion: row.descripcion?.trim() || null,
    reporteId: row.reporte_id ?? "",
    embedUrl: row.embed_url.trim(),
    estaActivo: row.esta_activo !== false,
  };
}

const EMBED_SELECT =
  "id_cuenta_reporte_embed,codigo_cuenta,descripcion,reporte_id,embed_url,esta_activo";

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

export async function listUsuarioReporteEmbedGrantIds(
  idUsuario: string,
  codigoCuenta: string,
): Promise<string[]> {
  const from = await tenantFrom(codigoCuenta);
  if (!from) return [];

  const { data, error } = await from("usuario_reporte_embed")
    .select("id_cuenta_reporte_embed")
    .eq("id_usuario", idUsuario.trim());

  if (error || !data?.length) return [];

  return (data as { id_cuenta_reporte_embed: string }[])
    .map((row) => row.id_cuenta_reporte_embed?.trim())
    .filter((id): id is string => Boolean(id));
}

export async function getUsuarioCuentaForPermisos(idUsuario: string): Promise<{
  idUsuario: string;
  codigoCuenta: string;
} | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const { data, error } = await client
    .from("usuario")
    .select("id_usuario,codigo_cuenta")
    .eq("id_usuario", idUsuario.trim())
    .eq("esta_activo", true)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as UsuarioCuentaRow;
  const codigoCuenta = row.codigo_cuenta?.trim();
  if (!codigoCuenta || !row.id_usuario) return null;

  return { idUsuario: row.id_usuario, codigoCuenta };
}

export async function replaceUsuarioReporteEmbedGrants(input: {
  idUsuario: string;
  codigoCuenta: string;
  reportIds: readonly string[];
}): Promise<string[]> {
  const reports = await listCuentaReporteEmbeds(input.codigoCuenta);
  const allowed = new Set(reports.map((row) => row.idCuentaReporteEmbed));
  const uniqueIds = [
    ...new Set(input.reportIds.map((id) => id.trim()).filter(Boolean)),
  ];

  if (uniqueIds.some((id) => !allowed.has(id))) {
    throw new Error("Hay reportes que no pertenecen a esta cuenta.");
  }

  const from = requireTenantFrom(await tenantFrom(input.codigoCuenta));
  const { error: deleteError } = await from("usuario_reporte_embed")
    .delete()
    .eq("id_usuario", input.idUsuario);

  if (deleteError) {
    throw new Error("No se pudieron actualizar los permisos.");
  }

  if (uniqueIds.length > 0) {
    const { error: insertError } = await from("usuario_reporte_embed").insert(
      uniqueIds.map((idCuentaReporteEmbed) => ({
        id_usuario: input.idUsuario,
        id_cuenta_reporte_embed: idCuentaReporteEmbed,
      })),
    );

    if (insertError) {
      throw new Error("No se pudieron guardar los permisos.");
    }
  }

  return uniqueIds;
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}
