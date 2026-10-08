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
import {
  formatOrdenTareaImpresaAt,
  resolveOrdenTareaCreadaAt,
} from "../print/map-orden-tarea-almacen";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  normalizeIdOrdenTrabajo,
  parseIdOrdenTrabajoFields,
  parseOrigenCorreoJson,
  type OrdenTrabajoHija,
} from "../utils/origen-correo-ordenes-trabajo";
import { filterLineasByOrdenTrabajoHija } from "../utils/filter-lineas-by-orden-trabajo";
import { extractNotasClaveCorreo } from "../utils/texto-origen-pedido";
import {
  computeEstadoAlistamientoFromCapturas,
  puedeAplicarEstadoAlistamiento,
} from "./compute-estado-alistamiento";
import type {
  OrdenSurtidoCapturaFotoRow,
  OrdenSurtidoCapturaOtConFotos,
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoCapturaRow,
} from "./orden-surtido.types";

interface CapturaDbRow {
  id_captura: string;
  id_orden_venta: string;
  id_orden_trabajo?: string | null;
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
    idOrdenTrabajo: normalizeIdOrdenTrabajo(row.id_orden_trabajo),
    codigoCuenta: row.codigo_cuenta,
    urlFoto: row.url_foto,
    payload: coercePayload(row.payload),
    modelo: row.modelo,
    updatedAt: row.updated_at,
  };
}

const CAPTURA_SELECT =
  "id_captura,id_orden_venta,id_orden_trabajo,codigo_cuenta,url_foto,payload,modelo,updated_at";

const FOTO_SELECT =
  "id_foto,id_orden_venta,id_orden_trabajo,codigo_cuenta,url_foto,created_at";

interface CapturaFotoDbRow {
  id_foto: string;
  id_orden_venta: string;
  id_orden_trabajo?: string | null;
  codigo_cuenta: string;
  url_foto: string;
  created_at: string;
}

function mapFotoRow(row: CapturaFotoDbRow): OrdenSurtidoCapturaFotoRow {
  return {
    idFoto: row.id_foto,
    idOrdenVenta: row.id_orden_venta,
    idOrdenTrabajo: normalizeIdOrdenTrabajo(row.id_orden_trabajo),
    codigoCuenta: row.codigo_cuenta,
    urlFoto: row.url_foto,
    createdAt: row.created_at,
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
  notas_almacen: string | null;
  origen_texto?: string | null;
  bodega_destino_label: string | null;
  ventana_desde?: string | null;
  ventana_hasta?: string | null;
  origen_correo?: unknown;
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

export async function getOrdenMetaPublica(
  idOrdenVenta: string,
  idOrdenTrabajo?: string | null,
): Promise<{
  idOrdenVenta: string;
  codigoCuenta: string;
  folio: string;
  tieneCaptura: boolean;
  idOrdenTrabajo: string;
} | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return null;

  const ot = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  let capturaQuery = adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura",
  )
    .select("id_captura")
    .eq("id_orden_venta", idOrdenVenta)
    .limit(1);

  if (ot) {
    capturaQuery = capturaQuery.eq("id_orden_trabajo", ot);
  }

  const { data: capturaRows } = await capturaQuery;
  const captura = Array.isArray(capturaRows) ? capturaRows[0] : capturaRows;

  return {
    idOrdenVenta,
    codigoCuenta: ctx.codigoCuenta,
    folio: ctx.codigo,
    tieneCaptura: Boolean(captura?.id_captura),
    idOrdenTrabajo: ot,
  };
}

/** Snapshot de impresión vía service role (sin sesión de usuario). */
export async function buildPrintDataAdmin(
  idOrdenVenta: string,
  idOrdenTrabajo?: string | null,
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
        "notas_almacen",
        "origen_texto",
        "bodega_destino_label",
        "ventana_desde",
        "ventana_hasta",
        "origen_correo",
        "comprador:comprador(nombre,codigo)",
      ].join(","),
    )
    .eq("id_orden_venta", idOrdenVenta)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!ordenRaw) return null;
  const orden = ordenRaw as unknown as OrdenPrintAdminRow;

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
  const lineasAll = (lineasRaw ?? []) as unknown as OrdenLineaPrintAdminRow[];

  const hijas = groupOrigenCorreoToOrdenesTrabajo(
    parseOrigenCorreoJson(orden.origen_correo),
  );
  const ot = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  let hija: OrdenTrabajoHija | null = null;
  let tareaIndex = 1;
  let tareaTotal = 1;
  let lineas = lineasAll;

  if (hijas.length > 0) {
    tareaTotal = hijas.length;
    const foundIndex = ot ? hijas.findIndex((item) => item.id === ot) : 0;
    const index = foundIndex >= 0 ? foundIndex : 0;
    hija = hijas[index] ?? null;
    tareaIndex = index + 1;
    if (hija) {
      const matched = filterLineasByOrdenTrabajoHija(lineasAll, hija);
      if (matched.length > 0) lineas = matched;
    }
  }

  const compradorRel = Array.isArray(orden.comprador)
    ? orden.comprador[0]
    : orden.comprador;
  const compradorNombre = compradorRel?.nombre?.trim() || "—";

  const captura = parseOrdenVentaCapturaObservaciones(orden.observaciones);
  const cliente = compradorNombre;

  const centroConsumo =
    hija?.almacen ||
    (typeof orden.centro_consumo === "string" && orden.centro_consumo.trim()) ||
    captura.centroConsumo;
  const numeroOrdenCliente =
    hija?.numeroPedido ||
    (typeof orden.orden_compra_hotel === "string" &&
      orden.orden_compra_hotel.trim()) ||
    captura.ordenCompraHotel.trim() ||
    orden.codigo;
  const fechaEntregaRaw =
    hija?.fecha ||
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
  const horaEntrega = (() => {
    const desde =
      (typeof orden.ventana_desde === "string" && orden.ventana_desde.trim()) ||
      "";
    const hasta =
      (typeof orden.ventana_hasta === "string" && orden.ventana_hasta.trim()) ||
      "";
    if (desde || hasta) {
      if (desde && hasta) return `${desde} – ${hasta}`;
      return desde || hasta;
    }
    return captura.ventanaEntrega.trim();
  })();
  const notasGenerales = extractNotasClaveCorreo(
    (typeof orden.origen_texto === "string" && orden.origen_texto.trim()) ||
      captura.origenTexto.trim() ||
      "",
  );

  return {
    idOrdenVenta,
    idOrdenTrabajo: hija?.id ?? ot,
    tareaIndex,
    tareaTotal,
    folio: orden.codigo,
    creada: (() => {
      const created = resolveOrdenTareaCreadaAt({
        createdAt: orden.created_at,
        fechaPedido: orden.fecha_pedido,
      });
      return created ? formatOrdenTareaImpresaAt(created) : "";
    })(),
    impresa: formatOrdenTareaImpresaAt(new Date()),
    cliente,
    centroConsumo,
    numeroOrdenCliente,
    ordenTrabajo: `${tareaIndex > 0 ? tareaIndex : 1}/${tareaTotal > 0 ? tareaTotal : 1}`,
    fechaEntrega: fechaEntregaRaw ? formatCapturaFecha(fechaEntregaRaw) : "",
    horaEntrega,
    direccionEntrega,
    notasGenerales,
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
  idOrdenTrabajo?: string | null,
): Promise<OrdenSurtidoCapturaRow | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return null;

  const ot = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  let query = adminFrom(admin, ctx.schemaName, "orden_venta_surtido_captura")
    .select(CAPTURA_SELECT)
    .eq("id_orden_venta", idOrdenVenta)
    .eq("id_orden_trabajo", ot);

  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return mapRow(data as CapturaDbRow);

  // Compat: capturas legacy sin OT cuando se pide una OT concreta y no hay fila.
  if (ot) {
    const { data: legacy, error: legacyError } = await adminFrom(
      admin,
      ctx.schemaName,
      "orden_venta_surtido_captura",
    )
      .select(CAPTURA_SELECT)
      .eq("id_orden_venta", idOrdenVenta)
      .eq("id_orden_trabajo", "")
      .maybeSingle();
    if (legacyError) throw new Error(legacyError.message);
    if (legacy) return mapRow(legacy as CapturaDbRow);
  }

  return null;
}

export async function listOrdenSurtidoCapturas(
  idOrdenVenta: string,
): Promise<OrdenSurtidoCapturaRow[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return [];

  const { data, error } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura",
  )
    .select(CAPTURA_SELECT)
    .eq("id_orden_venta", idOrdenVenta)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as CapturaDbRow));
}

export async function upsertOrdenSurtidoCaptura(input: {
  idOrdenVenta: string;
  idOrdenTrabajo?: string | null;
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

  const idOrdenTrabajo = normalizeIdOrdenTrabajo(input.idOrdenTrabajo);

  const { data, error } = await adminFrom(
    admin,
    schemaName,
    "orden_venta_surtido_captura",
  )
    .upsert(
      {
        id_orden_venta: input.idOrdenVenta,
        id_orden_trabajo: idOrdenTrabajo,
        codigo_cuenta: input.codigoCuenta,
        url_foto: input.urlFoto,
        payload: input.payload,
        modelo: input.modelo,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id_orden_venta,id_orden_trabajo" },
    )
    .select(CAPTURA_SELECT)
    .single();

  if (error) throw new Error(error.message);
  const row = mapRow(data as CapturaDbRow);

  const urlFoto = input.urlFoto?.trim() ?? "";
  if (urlFoto) {
    try {
      await appendOrdenSurtidoCapturaFoto({
        idOrdenVenta: input.idOrdenVenta,
        idOrdenTrabajo,
        codigoCuenta: input.codigoCuenta,
        urlFoto,
        schemaName,
      });
    } catch (fotoError) {
      console.error(
        "[surtido] append historial foto falló:",
        fotoError instanceof Error ? fotoError.message : fotoError,
      );
    }
  }

  return row;
}

async function appendOrdenSurtidoCapturaFoto(input: {
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  codigoCuenta: string;
  urlFoto: string;
  schemaName: string | null;
}): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const { error } = await adminFrom(
    admin,
    input.schemaName,
    "orden_venta_surtido_captura_foto",
  ).insert({
    id_orden_venta: input.idOrdenVenta,
    id_orden_trabajo: input.idOrdenTrabajo,
    codigo_cuenta: input.codigoCuenta,
    url_foto: input.urlFoto,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  try {
    const { recordOrdenVentaLogServer } = await import(
      "../services/orden-venta-log.server"
    );
    const label = input.idOrdenTrabajo.trim() || "OT";
    await recordOrdenVentaLogServer({
      idOrdenVenta: input.idOrdenVenta,
      codigoCuenta: input.codigoCuenta,
      accion: "actualizacion",
      mensaje: `Foto de surtido subida (orden de trabajo).`,
      idOrdenTrabajo: input.idOrdenTrabajo || null,
      payloadExtra: {
        tipo: "foto_surtido",
        idOrdenTrabajo: label,
        urlFoto: input.urlFoto,
      },
    });
  } catch (logError) {
    console.warn(
      "[surtido] log foto falló:",
      logError instanceof Error ? logError.message : logError,
    );
  }
}

/** OTs de una OV que tienen al menos una foto en el historial. */
export async function listOrdenSurtidoCapturaOtsConFotos(
  idOrdenVenta: string,
): Promise<OrdenSurtidoCapturaOtConFotos[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return [];

  const { data, error } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura_foto",
  )
    .select(FOTO_SELECT)
    .eq("id_orden_venta", idOrdenVenta)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const hijasById = new Map<string, OrdenTrabajoHija>();
  try {
    const { data: ordenRow } = await adminFrom(
      admin,
      ctx.schemaName,
      "orden_venta",
    )
      .select("origen_correo")
      .eq("id_orden_venta", idOrdenVenta)
      .maybeSingle();
    const hijas = groupOrigenCorreoToOrdenesTrabajo(
      parseOrigenCorreoJson(
        (ordenRow as { origen_correo?: unknown } | null)?.origen_correo,
      ),
    );
    for (const hija of hijas) {
      hijasById.set(hija.id, hija);
    }
  } catch {
    // Sin origen_correo: se usa parseo de la clave OT.
  }

  const byOt = new Map<string, OrdenSurtidoCapturaOtConFotos>();
  for (const raw of data ?? []) {
    const foto = mapFotoRow(raw as CapturaFotoDbRow);
    const existing = byOt.get(foto.idOrdenTrabajo);
    if (!existing) {
      const hija = hijasById.get(foto.idOrdenTrabajo);
      const parsed = parseIdOrdenTrabajoFields(foto.idOrdenTrabajo);
      byOt.set(foto.idOrdenTrabajo, {
        idOrdenTrabajo: foto.idOrdenTrabajo,
        totalFotos: 1,
        ultimaAt: foto.createdAt,
        previewUrl: foto.urlFoto,
        label: hija?.label || parsed.label,
        numeroPedido: hija?.numeroPedido || parsed.numeroPedido,
        centroConsumo: hija?.almacen || parsed.centroConsumo,
      });
      continue;
    }
    existing.totalFotos += 1;
  }

  return [...byOt.values()].sort((a, b) =>
    b.ultimaAt.localeCompare(a.ultimaAt),
  );
}

/** Historial de fotos de una OT concreta (incluye reemplazos). */
export async function listOrdenSurtidoCapturaFotos(
  idOrdenVenta: string,
  idOrdenTrabajo?: string | null,
): Promise<OrdenSurtidoCapturaFotoRow[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, idOrdenVenta);
  if (!ctx) return [];

  const ot = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  const { data, error } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta_surtido_captura_foto",
  )
    .select(FOTO_SELECT)
    .eq("id_orden_venta", idOrdenVenta)
    .eq("id_orden_trabajo", ot)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapFotoRow(row as CapturaFotoDbRow));
}

/**
 * Propaga el payload de la foto a columnas flat / observaciones / cantidades
 * despachadas de la OV. Solo escribe lo que la IA trajo con valor.
 * Los campos de pedido (fecha, centro, OC, dirección) solo se llenan si
 * estaban vacíos; chofer/unidad/turno/hora sí se actualizan siempre.
 */
export async function applySurtidoCapturaToOrdenVenta(input: {
  idOrdenVenta: string;
  idOrdenTrabajo?: string | null;
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
      "id_orden_venta,observaciones,turno,hora_salida,chofer,unidad,centro_consumo,fecha_entrega,orden_compra_hotel,direccion_entrega,notas_almacen,notas_lineas,origen_correo",
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
    const allLineas = (lineasRaw ?? []) as typeof lineasDb;

    const ot = normalizeIdOrdenTrabajo(input.idOrdenTrabajo);
    const hijas = groupOrigenCorreoToOrdenesTrabajo(
      parseOrigenCorreoJson(
        (orden as { origen_correo?: unknown }).origen_correo,
      ),
    );
    const hija = ot ? (hijas.find((item) => item.id === ot) ?? null) : null;

    if (hija) {
      const matched = filterLineasByOrdenTrabajoHija(allLineas, hija);
      lineasDb = matched.length > 0 ? matched : allLineas;
    } else {
      lineasDb = allLineas;
    }

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

  // Campos por OT: solo rellenar header OV si estaba vacío (no pisar otras hijas).
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

/**
 * Tras subir una foto QR, actualiza el estado de la OV:
 * confirmada → alistamiento (parcial) → alistada (todas las OT con foto).
 */
export async function syncOrdenVentaEstadoAlistamiento(input: {
  idOrdenVenta: string;
}): Promise<{ estado: string | null; updated: boolean }> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, input.idOrdenVenta);
  if (!ctx) {
    throw new Error("Orden de venta no encontrada para alistamiento.");
  }

  const { data: orden, error: ordenError } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta",
  )
    .select("id_orden_venta,estado,origen_correo")
    .eq("id_orden_venta", input.idOrdenVenta)
    .maybeSingle();

  if (ordenError) throw new Error(ordenError.message);
  if (!orden) {
    throw new Error("Orden de venta no encontrada para alistamiento.");
  }

  const estadoActual = String(orden.estado ?? "").trim();
  if (!puedeAplicarEstadoAlistamiento(estadoActual)) {
    return { estado: estadoActual || null, updated: false };
  }

  const hijas = groupOrigenCorreoToOrdenesTrabajo(
    parseOrigenCorreoJson(orden.origen_correo),
  );
  const capturas = await listOrdenSurtidoCapturas(input.idOrdenVenta);
  const conFoto = new Set(
    capturas
      .map((row) => normalizeIdOrdenTrabajo(row.idOrdenTrabajo))
      .filter(Boolean),
  );

  const totalOrdenesTrabajo = hijas.length;
  const ordenesTrabajoConFoto =
    totalOrdenesTrabajo === 0
      ? capturas.length > 0
        ? 1
        : 0
      : hijas.filter((hija) => conFoto.has(hija.id)).length;

  const siguiente = computeEstadoAlistamientoFromCapturas({
    totalOrdenesTrabajo,
    ordenesTrabajoConFoto,
  });

  if (!siguiente || siguiente === estadoActual) {
    return { estado: estadoActual, updated: false };
  }

  const { error: updateError } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta",
  )
    .update({
      estado: siguiente,
      updated_at: new Date().toISOString(),
    })
    .eq("id_orden_venta", input.idOrdenVenta);

  if (updateError) throw new Error(updateError.message);

  return { estado: siguiente, updated: true };
}
