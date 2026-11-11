import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordOrdenVentaLogServer } from "@/modules/sales/ordenes/services/orden-venta-log.server";
import { resolveTenantSchemaForCuenta } from "@/modules/sales/shared/services/sales-catalog.server";
import {
  ESTADO_DESPACHADA,
  ESTADOS_ORIGEN_DESPACHO,
  esEstadoOrigenDespacho,
  nombreClienteDeComprador,
  type ConfirmacionDespacho,
  type OrdenDespachoPublico,
} from "@/modules/sales/ordenes/despacho/despacho-publico";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

interface OrdenRow {
  id_orden_venta: string;
  codigo: string | null;
  estado: string | null;
  codigo_cuenta: string | null;
  comprador?: unknown;
}

export type ResultadoDespacho =
  | { ok: true }
  | { ok: false; error: string };

function fromSchema(admin: AdminClient, schemaName: string | null) {
  const scoped = schemaName ? admin.schema(schemaName) : admin;
  return scoped.from.bind(scoped);
}

function tablaAusente(message: string): boolean {
  return /does not exist|schema cache|Could not find the table/i.test(message);
}

async function leerOrdenesEnSchema(
  admin: AdminClient,
  schemaName: string | null,
): Promise<OrdenRow[]> {
  const from = fromSchema(admin, schemaName);
  const { data, error } = await from("orden_venta")
    .select(
      "id_orden_venta,codigo,estado,codigo_cuenta,comprador:comprador(nombre)",
    )
    .in("estado", [...ESTADOS_ORIGEN_DESPACHO])
    .limit(500);
  if (error) {
    if (tablaAusente(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as OrdenRow[];
}

function aOrdenPublica(
  row: OrdenRow,
): OrdenDespachoPublico | null {
  if (!esEstadoOrigenDespacho(row.estado)) return null;
  const idOrdenVenta = row.id_orden_venta?.trim();
  const codigoCuenta = row.codigo_cuenta?.trim();
  if (!idOrdenVenta || !codigoCuenta) return null;
  return {
    idOrdenVenta,
    codigo: row.codigo?.trim() || idOrdenVenta,
    estado: row.estado,
    codigoCuenta,
    nombreCliente: nombreClienteDeComprador(row.comprador),
  };
}

export async function listarOrdenesDespachoPublico(
  codigoCuenta: string,
): Promise<OrdenDespachoPublico[]> {
  const cuenta = codigoCuenta.trim();
  if (!cuenta) return [];
  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error("No se pudo cargar el listado.");
  }

  const schemaName = await resolveTenantSchemaForCuenta(admin, cuenta);
  const ordenes: OrdenDespachoPublico[] = [];
  for (const row of await leerOrdenesEnSchema(admin, schemaName)) {
    const orden = aOrdenPublica(row);
    if (!orden || orden.codigoCuenta !== cuenta) continue;
    ordenes.push(orden);
  }
  return ordenes.sort((a, b) => a.codigo.localeCompare(b.codigo));
}

async function buscarOrden(
  admin: AdminClient,
  idOrdenVenta: string,
  codigoCuenta: string,
): Promise<{ schemaName: string | null; estado: OrdenDespachoPublico["estado"] } | null> {
  const schemaName = await resolveTenantSchemaForCuenta(admin, codigoCuenta);
  const from = fromSchema(admin, schemaName);
  const { data, error } = await from("orden_venta")
    .select("id_orden_venta,estado,codigo_cuenta")
    .eq("id_orden_venta", idOrdenVenta)
    .eq("codigo_cuenta", codigoCuenta)
    .maybeSingle();
  if (error) {
    if (tablaAusente(error.message)) return null;
    throw new Error(error.message);
  }
  const row = data as Pick<OrdenRow, "estado"> | null;
  if (!row || !esEstadoOrigenDespacho(row.estado)) return null;
  return { schemaName, estado: row.estado };
}

export async function confirmarDespachoPublico(
  input: ConfirmacionDespacho,
): Promise<ResultadoDespacho> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, error: "No se pudo confirmar el despacho." };

  const encontrada = await buscarOrden(
    admin,
    input.idOrdenVenta,
    input.codigoCuenta,
  );
  if (!encontrada) {
    return {
      ok: false,
      error: "La orden ya no está en alistada ni en alistamiento.",
    };
  }

  const from = fromSchema(admin, encontrada.schemaName);
  const { data, error } = await from("orden_venta")
    .update({ estado: ESTADO_DESPACHADA })
    .eq("id_orden_venta", input.idOrdenVenta)
    .eq("codigo_cuenta", input.codigoCuenta)
    .eq("estado", encontrada.estado)
    .select("id_orden_venta")
    .maybeSingle();
  if (error) return { ok: false, error: "No se pudo confirmar el despacho." };
  if (!data) {
    return {
      ok: false,
      error: "La orden ya no está en alistada ni en alistamiento.",
    };
  }

  await recordOrdenVentaLogServer({
    idOrdenVenta: input.idOrdenVenta,
    codigoCuenta: input.codigoCuenta,
    accion: "cambio_estado",
    mensaje: `Despacho público: ${encontrada.estado} → ${ESTADO_DESPACHADA}. Despachó ${input.despachador}. Transportista ${input.transportista}.`,
    autorNombre: input.despachador,
    payloadExtra: {
      tipo: "despacho_publico",
      estado_anterior: encontrada.estado,
      estado: ESTADO_DESPACHADA,
      despachador: input.despachador,
      transportista: input.transportista,
    },
  }).catch(() => undefined);

  return { ok: true };
}
