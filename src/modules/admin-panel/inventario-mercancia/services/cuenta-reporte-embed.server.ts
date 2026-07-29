import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface EmbedReportSession {
  codigoCuenta: string;
  idUsuario: string;
}

export interface CuentaReporteEmbedRow {
  idCuentaReporteEmbed: string;
  codigoCuenta: string;
  descripcion: string | null;
  reporteId: string | null;
  embedUrl: string;
}

interface UsuarioCuentaRow {
  id_usuario: string;
  codigo_cuenta: string | null;
}

interface CuentaReporteEmbedDbRow {
  id_cuenta_reporte_embed: string;
  codigo_cuenta: string;
  descripcion: string | null;
  reporte_id: string | null;
  embed_url: string;
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
    .select("id_usuario,codigo_cuenta")
    .eq("id_auth", authData.user.id)
    .eq("esta_activo", true)
    .maybeSingle();

  if (usuarioError || !usuario) return null;

  const row = usuario as UsuarioCuentaRow;
  const codigoCuenta = row.codigo_cuenta?.trim();
  if (!codigoCuenta || !row.id_usuario) return null;

  return { codigoCuenta, idUsuario: row.id_usuario };
}

function mapEmbedRow(row: CuentaReporteEmbedDbRow): CuentaReporteEmbedRow {
  return {
    idCuentaReporteEmbed: row.id_cuenta_reporte_embed,
    codigoCuenta: row.codigo_cuenta,
    descripcion: row.descripcion?.trim() || null,
    reporteId: row.reporte_id,
    embedUrl: row.embed_url.trim(),
  };
}

/** Reportes activos de la cuenta (uno o varios). */
export async function listCuentaReporteEmbeds(
  codigoCuenta: string,
): Promise<CuentaReporteEmbedRow[]> {
  const client = getSupabaseAdminClient();
  if (!client) return [];

  const { data, error } = await client
    .from("cuenta_reporte_embed")
    .select(
      "id_cuenta_reporte_embed,codigo_cuenta,descripcion,reporte_id,embed_url",
    )
    .eq("codigo_cuenta", codigoCuenta.trim())
    .eq("esta_activo", true)
    .order("descripcion", { ascending: true });

  if (error || !data?.length) return [];

  return (data as CuentaReporteEmbedDbRow[])
    .map(mapEmbedRow)
    .filter((row) => Boolean(row.embedUrl));
}

/** URL activa de un embed concreto, o null si no aplica. */
export async function getCuentaReporteEmbedUrl(
  codigoCuenta: string,
  idCuentaReporteEmbed: string,
): Promise<string | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const { data, error } = await client
    .from("cuenta_reporte_embed")
    .select("embed_url")
    .eq("codigo_cuenta", codigoCuenta.trim())
    .eq("id_cuenta_reporte_embed", idCuentaReporteEmbed.trim())
    .eq("esta_activo", true)
    .maybeSingle();

  if (error || !data?.embed_url?.trim()) return null;
  return (data.embed_url as string).trim();
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}
