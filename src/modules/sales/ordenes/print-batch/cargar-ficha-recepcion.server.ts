import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RecepcionPrefacturaEnlace } from "./recepcion-prefactura";
import { fichaDesdeOrden, type FilaFichaRecepcion } from "./ficha-recepcion";

export interface FuenteFichaRecepcion {
  leer(enlace: RecepcionPrefacturaEnlace): Promise<FilaFichaRecepcion | null>;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function clienteDe(comprador: unknown): string {
  const rel = Array.isArray(comprador) ? comprador[0] : comprador;
  if (!rel || typeof rel !== "object") return "";
  const fila = rel as { razon_social?: unknown; nombre?: unknown };
  return texto(fila.razon_social) || texto(fila.nombre);
}

export function filaDesdeConsulta(
  empresa: { razon_social?: unknown } | null,
  orden: {
    centro_consumo?: unknown;
    origen_correo?: unknown;
    comprador?: unknown;
  } | null,
): FilaFichaRecepcion | null {
  if (!empresa && !orden) return null;
  return {
    razonSocial: texto(empresa?.razon_social),
    cliente: clienteDe(orden?.comprador),
    centroConsumo: texto(orden?.centro_consumo),
    origenCorreo: orden?.origen_correo ?? null,
  };
}

async function leerConAdmin(
  enlace: RecepcionPrefacturaEnlace,
): Promise<FilaFichaRecepcion | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const empresaQuery = await admin
    .from("empresa")
    .select("razon_social,schema_name")
    .eq("codigo_empresa", enlace.empresa)
    .maybeSingle();
  if (empresaQuery.error) throw new Error(empresaQuery.error.message);
  const schema = texto(empresaQuery.data?.schema_name);
  const ordenes = schema ? admin.schema(schema) : admin;
  const ordenQuery = await ordenes
    .from("orden_venta")
    .select("centro_consumo,origen_correo,comprador:comprador(nombre,razon_social)")
    .eq("codigo", enlace.ov)
    .maybeSingle();
  if (ordenQuery.error) throw new Error(ordenQuery.error.message);
  return filaDesdeConsulta(empresaQuery.data, ordenQuery.data);
}

/** Si el enlace no trae nombres, los lee de la orden. Si la consulta falla, la pantalla sigue con el enlace. */
export async function completarFichaRecepcion(
  enlace: RecepcionPrefacturaEnlace,
  fuente?: FuenteFichaRecepcion,
): Promise<RecepcionPrefacturaEnlace> {
  const leer = fuente?.leer ?? leerConAdmin;
  try {
    return fichaDesdeOrden(enlace, await leer(enlace));
  } catch {
    return fichaDesdeOrden(enlace, null);
  }
}
