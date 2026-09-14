import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatKgEs } from "@/lib/utils/decimal-es";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveTenantSchemaForCuenta } from "@/modules/sales/shared/services/sales-catalog.server";
import { buildOrdenVentaPatchFromSurtido } from "./sync-surtido-to-orden-venta";
import {
  formatCapturaFecha,
  notaCapturaForProducto,
  parseOrdenVentaCapturaObservaciones,
} from "../utils/build-orden-venta-captura-observaciones";
import { formatOrdenTareaImpresaAt } from "../print/map-orden-tarea-almacen";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type {
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoCapturaRow,
} from "./orden-surtido.types";

interface CapturaDbRow {
  id_captura: string;
  id_orden_venta: string;
  codigo_cuenta: string;
  url_foto: string | null;
  payload: OrdenSurtidoCapturaPayload | null;
  modelo: string | null;
  updated_at: string;
}

function coercePayload(
  raw: OrdenSurtidoCapturaPayload | null | undefined,
): OrdenSurtidoCapturaPayload {
  return {
    campos: raw?.campos ?? {},
    checks: raw?.checks ?? {},
    lineas: Array.isArray(raw?.lineas) ? raw.lineas : [],
    observacionesIa: raw?.observacionesIa ?? null,
  };
}

function mapRow(row: CapturaDbRow): OrdenSurtidoCapturaRow {
  return {
    idCaptura: row.id_captura,
    idOrdenVenta: row.id_orden_venta,
    codigoCuenta: row.codigo_cuenta,
    urlFoto: row.url_foto,
    payload: coercePayload(row.payload),
    modelo: row.modelo,
    updatedAt: row.updated_at,
  };
}

function resolveTituloProducto(producto: unknown): string {
  if (!producto || typeof producto !== "object") return "Producto";
  const row = Array.isArray(producto) ? producto[0] : producto;
  if (!row || typeof row !== "object") return "Producto";
  const data = row as {
    descripcion?: string | null;
    sku?: string | null;
    metadatos_catalogo?: { titulo?: string } | null;
  };
  const titulo = data.metadatos_catalogo?.titulo?.trim();
  if (titulo) return titulo;
  return data.descripcion?.trim() || data.sku?.trim() || "Producto";
}

interface OrdenPrintAdminRow {
  id_orden_venta: string;
  codigo: string;
  codigo_cuenta: string;
  observaciones: string | null;
  fecha_pedido: string;
  created_at: string;
  id_comprador: string | null;
  centro_consumo: string | null;
  orden_compra_hotel: string | null;
  fecha_entrega: string | null;
  direccion_entrega: string | null;
  notas_lineas: string | null;
  bodega_destino_label: string | null;
  comprador:
    | { nombre?: string | null; codigo?: string | null }
    | Array<{ nombre?: string | null; codigo?: string | null }>
    | null;
}

interface OrdenLineaPrintAdminRow {
  id_linea_orden_venta: string;
  cantidad_pedida: string | number;
  producto: unknown;
}

interface OrdenAdminContext {
  schemaName: string | null;
  codigoCuenta: string;
  codigo: string;
}

function adminFrom(
  admin: SupabaseClient,
  schemaName: string | null,
  table: string,
) {
  return schemaName
    ? admin.schema(schemaName).from(table)
    : admin.from(table);
}

async function resolveOrdenAdminContext(
  admin: SupabaseClient,
  idOrdenVenta: string,
): Promise<OrdenAdminContext | null> {
  const readMeta = async (schemaName: string | null) => {
    const { data, error } = await adminFrom(admin, schemaName, "orden_venta")
      .select("id_orden_venta,codigo_cuenta,codigo")
      .eq("id_orden_venta", idOrdenVenta)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      schemaName,
      codigoCuenta: String(data.codigo_cuenta ?? "").trim(),
      codigo: String(data.codigo ?? "").trim(),
    } satisfies OrdenAdminContext;
  };

  const inPublic = await readMeta(null);
  if (inPublic) {
    const tenantSchema = inPublic.codigoCuenta
      ? await resolveTenantSchemaForCuenta(admin, inPublic.codigoCuenta)
      : null;
    if (!tenantSchema) return inPublic;
    const inTenant = await readMeta(tenantSchema);
    return inTenant ?? inPublic;
  }

  const { data: empresas, error: empresasError } = await admin
    .from("empresa")
    .select("schema_name")
    .not("schema_name", "is", null)
    .limit(500);
  if (empresasError) throw new Error(empresasError.message);

  for (const empresa of empresas ?? []) {
    const schemaName =
      typeof empresa.schema_name === "string"
        ? empresa.schema_name.trim()
        : "";
    if (!schemaName) continue;
    const hit = await readMeta(schemaName);
    if (hit) return hit;
  }

  return null;
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export async function getOrdenMetaPublica(idOrdenVenta: string): Promise<{
  idOrdenVenta: string;
  codigoCuenta: string;
  folio: string;
  tieneCaptura: boolean;
} | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return null;

  const { data: captura } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura",
  )
    .select("id_captura")
    .eq("id_orden_venta", idOrdenVenta)
    .maybeSingle();

  return {
    idOrdenVenta,
    codigoCuenta: ctx.codigoCuenta,
    folio: ctx.codigo,
    tieneCaptura: Boolean(captura?.id_captura),
  };
}

/** Snapshot de impresión vía service role (sin sesión de usuario). */
export async function buildPrintDataAdmin(
  idOrdenVenta: string,
): Promise<OrdenTareaAlmacenPrintData | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return null;

  const { data: ordenRaw, error } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta",
  )
    .select(
      [
        "id_orden_venta",
        "codigo",
        "codigo_cuenta",
        "observaciones",
        "fecha_pedido",
        "created_at",
        "id_comprador",
        "centro_consumo",
        "orden_compra_hotel",
        "fecha_entrega",
        "direccion_entrega",
        "notas_lineas",
        "bodega_destino_label",
        "comprador:comprador(nombre,codigo)",
      ].join(","),
    )
    .eq("id_orden_venta", idOrdenVenta)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!ordenRaw) return null;
  const orden = ordenRaw as unknown as OrdenPrintAdminRow;

  // orden_venta_linea: id_linea_orden_venta, id_orden_venta, id_producto,
  // cantidad_pedida, cantidad_despachada, precio_unitario (NO created_at).
  const { data: lineasRaw, error: lineasError } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_linea",
  )
    .select(
      [
        "id_linea_orden_venta",
        "cantidad_pedida",
        "producto:producto(sku,descripcion,metadatos_catalogo)",
      ].join(","),
    )
    .eq("id_orden_venta", idOrdenVenta)
    .order("id_linea_orden_venta", { ascending: true })
    .limit(200);

  if (lineasError) throw new Error(lineasError.message);
  const lineas = (lineasRaw ?? []) as unknown as OrdenLineaPrintAdminRow[];

  const compradorRel = Array.isArray(orden.comprador)
    ? orden.comprador[0]
    : orden.comprador;
  const compradorNombre = compradorRel?.nombre?.trim() || "—";
  const compradorCodigo = compradorRel?.codigo?.trim() || "";

  const captura = parseOrdenVentaCapturaObservaciones(orden.observaciones);
  const cliente = compradorCodigo
    ? `${compradorCodigo} — ${compradorNombre}`
    : compradorNombre;

  const centroConsumo =
    (typeof orden.centro_consumo === "string" && orden.centro_consumo.trim()) ||
    captura.centroConsumo;
  const numeroOrdenCliente =
    (typeof orden.orden_compra_hotel === "string" &&
      orden.orden_compra_hotel.trim()) ||
    captura.ordenCompraHotel.trim() ||
    orden.codigo;
  const fechaEntregaRaw =
    (typeof orden.fecha_entrega === "string" && orden.fecha_entrega.trim()) ||
    captura.fechaEntrega.trim();
  const direccionEntrega =
    (typeof orden.direccion_entrega === "string" &&
      orden.direccion_entrega.trim()) ||
    captura.direccion.trim() ||
    (typeof orden.bodega_destino_label === "string" &&
      orden.bodega_destino_label.trim()) ||
    "";

  const notasLineas =
    (typeof orden.notas_lineas === "string" && orden.notas_lineas.trim()) ||
    captura.notasLineas;

  return {
    idOrdenVenta,
    folio: orden.codigo,
    impresa: formatOrdenTareaImpresaAt(new Date()),
    cliente,
    centroConsumo,
    numeroOrdenCliente,
    fechaEntrega: fechaEntregaRaw
      ? formatCapturaFecha(fechaEntregaRaw)
      : "",
    direccionEntrega,
    lineas: lineas.map((linea) => {
      const producto = resolveTituloProducto(linea.producto);
      return {
        producto,
        especificacion: notaCapturaForProducto(notasLineas, producto),
        cantidadSolicitada: `${formatKgEs(Number(linea.cantidad_pedida) || 0)} kg`,
      };
    }),
  };
}

export async function getOrdenSurtidoCaptura(
  idOrdenVenta: string,
): Promise<OrdenSurtidoCapturaRow | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return null;

  const { data, error } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura",
  )
    .select(
      "id_captura,id_orden_venta,codigo_cuenta,url_foto,payload,modelo,updated_at",
    )
    .eq("id_orden_venta", idOrdenVenta)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as CapturaDbRow);
}

export async function upsertOrdenSurtidoCaptura(input: {
  idOrdenVenta: string;
  codigoCuenta: string;
  urlFoto: string | null;
  payload: OrdenSurtidoCapturaPayload;
  modelo: string;
}): Promise<OrdenSurtidoCapturaRow> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, input.idOrdenVenta);
  const schemaName =
    ctx?.schemaName ??
    (await resolveTenantSchemaForCuenta(admin, input.codigoCuenta));

  const { data, error } = await adminFrom(
    admin,
    schemaName,
    "orden_venta_surtido_captura",
  )
    .upsert(
      {
        id_orden_venta: input.idOrdenVenta,
        codigo_cuenta: input.codigoCuenta,
        url_foto: input.urlFoto,
        payload: input.payload,
        modelo: input.modelo,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id_orden_venta" },
    )
    .select(
      "id_captura,id_orden_venta,codigo_cuenta,url_foto,payload,modelo,updated_at",
    )
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as CapturaDbRow);
}

/**
 * Propaga el payload de la foto a columnas flat / observaciones / cantidades
 * despachadas de la OV. Solo escribe lo que la IA trajo con valor.
 * Los campos de pedido (fecha, centro, OC, dirección) solo se llenan si
 * estaban vacíos; chofer/unidad/turno/hora sí se actualizan siempre.
 */
export async function applySurtidoCapturaToOrdenVenta(input: {
  idOrdenVenta: string;
  payload: OrdenSurtidoCapturaPayload;
}): Promise<{
  updatedHeader: boolean;
  updatedLineas: number;
}> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, input.idOrdenVenta);
  if (!ctx) {
    throw new Error("Orden de venta no encontrada para sincronizar surtido.");
  }

  const { data: orden, error: ordenError } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta",
  )
    .select(
      "id_orden_venta,observaciones,turno,hora_salida,chofer,unidad,centro_consumo,fecha_entrega,orden_compra_hotel,direccion_entrega,notas_almacen,notas_lineas",
    )
    .eq("id_orden_venta", input.idOrdenVenta)
    .maybeSingle();

  if (ordenError) throw new Error(ordenError.message);
  if (!orden) {
    throw new Error("Orden de venta no encontrada para sincronizar surtido.");
  }

  let lineasDb: Array<{
    id_linea_orden_venta: string;
    cantidad_pedida: string | number;
    cantidad_despachada: string | number | null;
    producto: unknown;
  }> = [];
  const productosByIndex = new Map<number, string>();
  try {
    const { data: lineasRaw, error: lineasError } = await adminFrom(
      admin,
      ctx.schemaName,
      "orden_venta_linea",
    )
      .select(
        "id_linea_orden_venta,cantidad_pedida,cantidad_despachada,producto:producto(sku,descripcion,metadatos_catalogo)",
      )
      .eq("id_orden_venta", input.idOrdenVenta)
      .order("id_linea_orden_venta", { ascending: true })
      .limit(200);

    if (lineasError) throw new Error(lineasError.message);
    lineasDb = (lineasRaw ?? []) as typeof lineasDb;
    lineasDb.forEach((linea, index) => {
      productosByIndex.set(index + 1, resolveTituloProducto(linea.producto));
    });
  } catch (lineasLookupError) {
    console.error(
      "[captura-orden] no se pudieron leer líneas para sync:",
      lineasLookupError instanceof Error
        ? lineasLookupError.message
        : lineasLookupError,
    );
  }

  const { flat, lineas: lineasPatch } = buildOrdenVentaPatchFromSurtido({
    payload: input.payload,
    observacionesActuales: orden.observaciones,
    notasAlmacenActuales: orden.notas_almacen,
    notasLineasActuales: orden.notas_lineas,
    productosByIndex,
  });

  const headerUpdate: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };
  if (flat.turno) headerUpdate.turno = flat.turno;
  if (flat.hora_salida) headerUpdate.hora_salida = flat.hora_salida;
  if (flat.chofer) headerUpdate.chofer = flat.chofer;
  if (flat.unidad) headerUpdate.unidad = flat.unidad;
  if (flat.notas_almacen) headerUpdate.notas_almacen = flat.notas_almacen;
  if (flat.notas_lineas) headerUpdate.notas_lineas = flat.notas_lineas;
  if (flat.observaciones) headerUpdate.observaciones = flat.observaciones;
  if (flat.centro_consumo && !emptyToNull(orden.centro_consumo)) {
    headerUpdate.centro_consumo = flat.centro_consumo;
  }
  if (flat.fecha_entrega && !emptyToNull(orden.fecha_entrega)) {
    headerUpdate.fecha_entrega = flat.fecha_entrega;
  }
  if (flat.orden_compra_hotel && !emptyToNull(orden.orden_compra_hotel)) {
    headerUpdate.orden_compra_hotel = flat.orden_compra_hotel;
  }
  if (flat.direccion_entrega && !emptyToNull(orden.direccion_entrega)) {
    headerUpdate.direccion_entrega = flat.direccion_entrega;
  }

  const { error: updateHeaderError } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta",
  )
    .update(headerUpdate)
    .eq("id_orden_venta", input.idOrdenVenta);

  if (updateHeaderError) throw new Error(updateHeaderError.message);

  let updatedLineas = 0;
  for (const patch of lineasPatch) {
    const linea = lineasDb[patch.indice - 1];
    if (!linea) continue;

    const pedida = Number(linea.cantidad_pedida) || 0;
    const despachada = Math.min(
      patch.cantidadDespachada,
      pedida > 0 ? pedida : patch.cantidadDespachada,
    );

    const { error: lineError } = await adminFrom(
      admin,
      ctx.schemaName,
      "orden_venta_linea",
    )
      .update({ cantidad_despachada: despachada })
      .eq("id_linea_orden_venta", linea.id_linea_orden_venta);

    if (lineError) throw new Error(lineError.message);
    updatedLineas += 1;
  }

  return {
    updatedHeader: Object.keys(headerUpdate).length > 1,
    updatedLineas,
  };
}
