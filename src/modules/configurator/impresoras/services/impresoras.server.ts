import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ImpresoraModoEnvio,
  ImpresoraPrintTarget,
  ImpresoraTamanoPapel,
  ImpresoraTipoConexion,
} from "./impresoras.service";

/**
 * Resuelve la impresora activa de la cuenta en el servidor (service role).
 * No usar getImpresoraActivaCuenta del browser aquí: en Route Handlers no hay
 * sesión Supabase y RLS devolvería 0 filas → falso «No hay impresora».
 */
export async function getImpresoraActivaCuentaServer(
  codigoCuenta: string,
): Promise<ImpresoraPrintTarget | null> {
  const codigo = codigoCuenta.trim();
  if (!codigo) return null;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error(
      "Supabase admin no configurado (SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const { data, error } = await admin
    .from("impresora")
    .select(
      "id_impresora,codigo_cuenta,nombre,tipo_conexion,modo_envio,host_ip,puerto,cola_nombre,nombre_sistema,id_agente,email_destino,usa_tls,copias_default,tamano_papel,esta_activa,id_usuario",
    )
    .eq("codigo_cuenta", codigo)
    .eq("esta_activa", true)
    .order("nombre", { ascending: true })
    .limit(20);

  if (error) {
    throw new Error(error.message || "No se pudo consultar impresoras.");
  }

  const rows = data ?? [];
  if (rows.length === 0) return null;

  const preferred =
    rows.find((row) => !row.id_usuario) ?? rows[0]!;

  return {
    idImpresora: preferred.id_impresora,
    nombre: preferred.nombre,
    codigoCuenta: preferred.codigo_cuenta,
    tipoConexion: preferred.tipo_conexion as ImpresoraTipoConexion,
    modoEnvio: preferred.modo_envio as ImpresoraModoEnvio,
    hostIp: preferred.host_ip,
    puerto: preferred.puerto,
    colaNombre: preferred.cola_nombre,
    nombreSistema: preferred.nombre_sistema,
    idAgente: preferred.id_agente,
    emailDestino: preferred.email_destino ?? null,
    usaTls: Boolean(preferred.usa_tls),
    copiasDefault: preferred.copias_default ?? 1,
    tamanoPapel: (preferred.tamano_papel ?? "letter") as ImpresoraTamanoPapel,
  };
}
