import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatKgEs } from "@/lib/utils/decimal-es";
import {
  formatCapturaFecha,
  notaCapturaForProducto,
  parseOrdenVentaCapturaObservaciones,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import {
  formatOrdenTareaImpresaAt,
  resolveOrdenTareaCreadaAt,
} from "../print/map-orden-tarea-almacen";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  normalizeIdOrdenTrabajo,
  parseOrigenCorreoJson,
  type OrdenTrabajoHija,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { filterLineasByOrdenTrabajoHija } from "../utils/ot/filter-lineas-by-orden-trabajo";
import { extractNotasClaveCorreo } from "../utils/origen/texto-origen-pedido";
import { adminFrom, resolveOrdenAdminContext } from "./orden-surtido-admin";
import { resolveTituloProducto } from "./orden-surtido-captura-mappers";

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
    | {
        nombre?: string | null;
        codigo?: string | null;
        razon_social?: string | null;
        apodo?: string | null;
      }
    | Array<{
        nombre?: string | null;
        codigo?: string | null;
        razon_social?: string | null;
        apodo?: string | null;
      }>
    | null;
}

interface OrdenLineaPrintAdminRow {
  id_linea_orden_venta: string;
  cantidad_pedida: string | number;
  producto: unknown;
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
        "comprador:comprador(nombre,codigo,razon_social,apodo)",
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
  const cliente = compradorRel?.razon_social?.trim() || compradorNombre;
  const clienteDenominacionComercial = compradorRel?.apodo?.trim() || "";

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
    clienteDenominacionComercial,
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