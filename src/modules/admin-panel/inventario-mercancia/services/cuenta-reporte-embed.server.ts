import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface EmbedReportSession {
  codigoCuenta: string;
  idUsuario: string;
}

interface UsuarioCuentaRow {
  id_usuario: string;
  codigo_cuenta: string | null;
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

/** URL activa de embed para la cuenta, o null si no aplica. */
export async function getCuentaReporteEmbedUrl(
  codigoCuenta: string,
): Promise<string | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const { data, error } = await client
    .from("cuenta_reporte_embed")
    .select("embed_url")
    .eq("codigo_cuenta", codigoCuenta.trim())
    .eq("esta_activo", true)
    .maybeSingle();

  if (error || !data?.embed_url?.trim()) return null;
  return data.embed_url.trim();
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}
