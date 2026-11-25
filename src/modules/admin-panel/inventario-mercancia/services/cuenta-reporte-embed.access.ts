import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { listCuentaReporteEmbeds } from "./cuenta-reporte-embed.crud";
import { requireTenantFrom, tenantFrom } from "./cuenta-reporte-embed.tenant";
import type {
  EmbedReportSession,
  UsuarioCuentaRow,
} from "./cuenta-reporte-embed.types";

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