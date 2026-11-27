import { env } from "@/config/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { despachoLocalPuedeEscribirEstado } from "@/modules/sales/ordenes/despacho/despacho-publico-local";
import { avanzarEstadoSurtidoEnNest } from "@/modules/sales/ordenes/surtido/avanzar-estado-surtido.server";
import { recordOrdenVentaLogServer } from "@/modules/sales/ordenes/services/orden-venta-log.server";
import { resolveTenantSchemaForCuenta } from "@/modules/sales/shared/services/sales-catalog.server";
import {
  ESTADO_DESPACHADA,
  ESTADOS_ORIGEN_DESPACHO,
  cantidadOrdenesTrabajoDespacho,
  denominacionComercialDespacho,
  esEstadoOrigenDespacho,
  nombreClienteDeComprador,
  ordenCompraClienteDespacho,
  type ConfirmacionDespacho,
  type OrdenDespachoPublico,
} from "@/modules/sales/ordenes/despacho/despacho-publico";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

interface OrdenRow {
  id_orden_venta: string;
  codigo: string | null;
  estado: string | null;
  codigo_cuenta: string | null;
  orden_compra_hotel?: string | null;
  denominacion_comercial_override?: string | null;
  origen_correo?: unknown;
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
      "id_orden_venta,codigo,estado,codigo_cuenta,orden_compra_hotel,denominacion_comercial_override,origen_correo,comprador:comprador(nombre,apodo,denominacion_comercial_override)",
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
  const comprador = compradorDeFila(row.comprador);
  return {
    idOrdenVenta,
    codigo: row.codigo?.trim() || idOrdenVenta,
    estado: row.estado,
    codigoCuenta,
    nombreCliente: nombreClienteDeComprador(row.comprador),
    denominacionComercial: denominacionComercialDespacho({
      orden: row.denominacion_comercial_override,
      comprador: comprador.denominacion,
      apodo: comprador.apodo,
    }),
    cantidadOrdenesTrabajo: cantidadOrdenesTrabajoDespacho(row.origen_correo),
    ordenCompraCliente: ordenCompraClienteDespacho(row.orden_compra_hotel),
  };
}

function compradorDeFila(comprador: unknown): { denominacion: unknown; apodo: unknown } {
  const rel = Array.isArray(comprador) ? comprador[0] : comprador;
  if (!rel || typeof rel !== "object") return { denominacion: null, apodo: null };
  const fila = rel as { denominacion_comercial_override?: unknown; apodo?: unknown };
  return { denominacion: fila.denominacion_comercial_override, apodo: fila.apodo };
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

  const escrito = await escribirEstadoDespachoEnNest(input);
  if (escrito === "local") {
    const local = await escribirEstadoDespachadaLocal(
      admin,
      encontrada.schemaName,
      input,
    );
    if (!local.ok) return local;
  } else if (escrito) {
    return escrito;
  }

  try {
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
    });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/** El estado lo escribe Nest. Si el API local no tiene la ruta, lo escribe este servidor. */
async function escribirEstadoDespachoEnNest(
  input: ConfirmacionDespacho,
): Promise<ResultadoDespacho | "local" | null> {
  try {
    await avanzarEstadoSurtidoEnNest({
      idOrdenVenta: input.idOrdenVenta,
      estado: ESTADO_DESPACHADA,
      codigoCuenta: input.codigoCuenta,
    });
    return null;
  } catch (error: unknown) {
    const detalle = error instanceof Error ? error.message : "";
    const transicionRechazada =
      detalle.includes("409") ||
      detalle.toLowerCase().includes("no permitida");
    if (transicionRechazada) {
      return {
        ok: false,
        error: "La orden ya no está en alistada ni en alistamiento.",
      };
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? env.apiBaseUrl;
    if (despachoLocalPuedeEscribirEstado(detalle, apiBaseUrl)) return "local";
    return { ok: false, error: "No se pudo confirmar el despacho." };
  }
}

async function escribirEstadoDespachadaLocal(
  admin: AdminClient,
  schemaName: string | null,
  input: ConfirmacionDespacho,
): Promise<ResultadoDespacho> {
  const from = fromSchema(admin, schemaName);
  const { data, error } = await from("orden_venta")
    .update({ estado: ESTADO_DESPACHADA })
    .eq("id_orden_venta", input.idOrdenVenta)
    .eq("codigo_cuenta", input.codigoCuenta)
    .in("estado", [...ESTADOS_ORIGEN_DESPACHO])
    .select("id_orden_venta");
  if (error || !Array.isArray(data) || data.length === 0) {
    return { ok: false, error: "No se pudo confirmar el despacho." };
  }
  return { ok: true };
}
