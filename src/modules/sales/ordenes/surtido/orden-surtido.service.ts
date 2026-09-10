import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatKgEs } from "@/lib/utils/decimal-es";
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

export async function getOrdenMetaPublica(idOrdenVenta: string): Promise<{
  idOrdenVenta: string;
  codigoCuenta: string;
  folio: string;
  tieneCaptura: boolean;
} | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const { data, error } = await admin
    .from("orden_venta")
    .select("id_orden_venta,codigo_cuenta,codigo")
    .eq("id_orden_venta", idOrdenVenta)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: captura } = await admin
    .from("orden_venta_surtido_captura")
    .select("id_captura")
    .eq("id_orden_venta", idOrdenVenta)
    .maybeSingle();

  return {
    idOrdenVenta: data.id_orden_venta,
    codigoCuenta: data.codigo_cuenta,
    folio: data.codigo,
    tieneCaptura: Boolean(captura?.id_captura),
  };
}

/** Snapshot de impresión vía service role (sin sesión de usuario). */
export async function buildPrintDataAdmin(
  idOrdenVenta: string,
): Promise<OrdenTareaAlmacenPrintData | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  // Columnas verificadas en public.orden_venta (sin inventar created_at en líneas).
  const { data: ordenRaw, error } = await admin
    .from("orden_venta")
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
  const { data: lineasRaw, error: lineasError } = await admin
    .from("orden_venta_linea")
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

  const { data, error } = await admin
    .from("orden_venta_surtido_captura")
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

  const { data, error } = await admin
    .from("orden_venta_surtido_captura")
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
