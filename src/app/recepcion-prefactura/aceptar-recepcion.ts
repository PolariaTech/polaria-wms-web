"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeEstadoOrdenVenta } from "@/modules/sales/shared/constants/sales-status";
import {
  armarCuerpoPrefacturaCompaq,
  enviarPrefacturaCompaq,
  MENSAJE_OV_POR_CONFIRMAR,
  mensajeFacturado,
  type DatosPrefacturaCompaq,
  type LineaPrefacturaCompaq,
} from "@/modules/sales/ordenes/print-batch/prefactura-compaq";
import {
  MENSAJE_ETAPAS_PREFACTURA,
  TIPO_PREFACTURA_ACEPTADA,
  estadosRecorridos,
  filasPrefactura,
  puedeConfirmarPrefactura,
  todasAprobadas,
  type FilaPrefactura,
} from "@/modules/sales/ordenes/print-batch/prefactura-seguimiento";
import { parseOrigenCorreoJson } from "@/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo";

export interface AceptarRecepcionResultado {
  ok: boolean;
  mensaje: string;
  error: string;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function primero(rel: unknown): { codigo?: unknown; sku?: unknown } | null {
  const fila = Array.isArray(rel) ? rel[0] : rel;
  return fila && typeof fila === "object" ? (fila as { codigo?: unknown; sku?: unknown }) : null;
}

export async function aceptarRecepcionPrefactura(input: {
  empresa: string;
  ov: string;
  ot: string;
}): Promise<AceptarRecepcionResultado> {
  const datos = await leerDatos(input.empresa, input.ov);
  if (!datos.ok) return { ok: false, mensaje: "", error: datos.error };
  const cuerpo = armarCuerpoPrefacturaCompaq({ ...datos.datos, ot: input.ot });
  if (!cuerpo.ok) return { ok: false, mensaje: "", error: cuerpo.error };
  const compaq = await enviarPrefacturaCompaq(cuerpo.cuerpo);
  if (!compaq.ok) return { ok: false, mensaje: "", error: compaq.error ?? "Compaq no creó la prefactura." };
  const guardada = await registrarAceptacion(
    datos.schema,
    datos.cuenta,
    datos.idOrden,
    input.ot,
    mensajeAceptacion(filasPrefactura(datos.datos.renglones, input.ov), input.ot),
  );
  if (!guardada) {
    return {
      ok: false,
      mensaje: "",
      error: "Compaq creó la prefactura, pero no se guardó la confirmación en la bitácora.",
    };
  }
  const filas = filasPrefactura(datos.datos.renglones, input.ov);
  if (!todasAprobadas(filas, datos.payloads, input.ot)) {
    return {
      ok: true,
      mensaje: `${mensajeFacturado(compaq)} Falta aprobar las demás órdenes de trabajo.`,
      error: "",
    };
  }
  const marcada = await marcarFacturada(datos.schema, input.ov);
  if (!marcada) {
    return {
      ok: false,
      mensaje: "",
      error: "Compaq creó la prefactura, pero la orden no pasó a facturada.",
    };
  }
  const enBitacora = await registrarPasoFacturada(datos.schema, datos.cuenta, datos.idOrden, datos.estado);
  if (!enBitacora) {
    return {
      ok: false,
      mensaje: "",
      error: "La orden pasó a facturada, pero no se guardó el cambio en la bitácora.",
    };
  }
  return { ok: true, mensaje: mensajeFacturado(compaq), error: "" };
}

type DatosLeidos = {
  ok: true;
  schema: string;
  cuenta: string;
  idOrden: string;
  estado: string;
  payloads: Record<string, unknown>[];
  datos: DatosPrefacturaCompaq;
};

async function leerDatos(
  empresa: string,
  ov: string,
): Promise<DatosLeidos | { ok: false; error: string }> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, error: "No hay conexión con la base." };
  const empresaQuery = await admin
    .from("empresa")
    .select("schema_name")
    .eq("codigo_empresa", empresa.trim())
    .maybeSingle();
  if (empresaQuery.error) return { ok: false, error: "No se pudo leer la empresa." };
  const schema = texto(empresaQuery.data?.schema_name);
  if (!schema) return { ok: false, error: "La empresa no tiene esquema." };
  return leerOrden(admin, schema, ov);
}

async function leerOrden(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  schema: string,
  ov: string,
): Promise<DatosLeidos | { ok: false; error: string }> {
  const ordenQuery = await admin
    .schema(schema)
    .from("orden_venta")
    .select("id_orden_venta,codigo_cuenta,estado,fecha_pedido,origen_correo,comprador:comprador(codigo),orden_venta_linea(cantidad_pedida,match_producto,producto:producto(sku))")
    .eq("codigo", ov.trim())
    .maybeSingle();
  if (ordenQuery.error || !ordenQuery.data) {
    return { ok: false, error: "No se encontró la orden de venta." };
  }
  if (normalizeEstadoOrdenVenta(texto(ordenQuery.data.estado)) === "por_confirmar") {
    return { ok: false, error: MENSAJE_OV_POR_CONFIRMAR };
  }
  const etapas = await leerEtapas(admin, schema, texto(ordenQuery.data.id_orden_venta), texto(ordenQuery.data.estado));
  if (!etapas.ok) return etapas;
  const payloads = etapas.payloads;
  const renglones = parseOrigenCorreoJson(ordenQuery.data.origen_correo);
  return {
    ok: true,
    schema,
    cuenta: texto(ordenQuery.data.codigo_cuenta),
    idOrden: texto(ordenQuery.data.id_orden_venta),
    estado: texto(ordenQuery.data.estado),
    payloads,
    datos: {
      fechaPedido: texto(ordenQuery.data.fecha_pedido),
      codigoCliente: texto(primero(ordenQuery.data.comprador)?.codigo),
      codigoOv: ov.trim(),
      ot: "",
      renglones,
      lineas: lineasCatalogo(ordenQuery.data.orden_venta_linea),
    },
  };
}

function lineasCatalogo(filas: unknown): LineaPrefacturaCompaq[] {
  if (!Array.isArray(filas)) return [];
  return filas.flatMap((fila) => {
    if (!fila || typeof fila !== "object") return [];
    const row = fila as {
      cantidad_pedida?: unknown;
      match_producto?: { textoCliente?: unknown };
      producto?: unknown;
    };
    const sku = texto(primero(row.producto)?.sku);
    const cantidad = Number(row.cantidad_pedida);
    if (!sku || !Number.isFinite(cantidad)) return [];
    return [{
      textoCliente: texto(row.match_producto?.textoCliente),
      sku,
      cantidad,
    }];
  });
}

async function leerEtapas(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  schema: string,
  idOrden: string,
  estado: string,
): Promise<{ ok: true; payloads: Record<string, unknown>[] } | { ok: false; error: string }> {
  const bitacora = await admin
    .schema(schema)
    .from("auditoria_operacion")
    .select("payload")
    .eq("entidad", "orden_venta")
    .eq("entidad_id", idOrden);
  if (bitacora.error) return { ok: false, error: "No se pudo leer la bitácora." };
  const payloads = payloadsDe(bitacora.data);
  if (!puedeConfirmarPrefactura(estado, estadosRecorridos(payloads))) {
    return { ok: false, error: MENSAJE_ETAPAS_PREFACTURA };
  }
  return { ok: true, payloads };
}

function payloadsDe(filas: unknown): Record<string, unknown>[] {
  if (!Array.isArray(filas)) return [];
  return filas.flatMap((fila) => {
    if (!fila || typeof fila !== "object") return [];
    const payload = (fila as { payload?: unknown }).payload;
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? [payload as Record<string, unknown>]
      : [];
  });
}

function mensajeAceptacion(filas: FilaPrefactura[], ot: string): string {
  const fila = filas.find((item) => item.id === ot.trim());
  const nombre = fila?.centro.trim() || fila?.numero.trim() || "";
  return nombre
    ? `Prefactura ${nombre} aprobada en la recepción.`
    : "Prefactura aceptada en la recepción.";
}

async function registrarAceptacion(
  schema: string,
  cuenta: string,
  idOrden: string,
  ot: string,
  mensaje: string,
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (!admin || !cuenta || !idOrden) return false;
  const guardado = await admin.schema(schema).from("auditoria_operacion").insert({
    codigo_cuenta: cuenta,
    id_bodega: null,
    id_usuario: null,
    accion: "actualizacion",
    entidad: "orden_venta",
    entidad_id: idOrden,
    payload: {
      mensaje,
      tipo: TIPO_PREFACTURA_ACEPTADA,
      idOrdenTrabajo: ot.trim(),
      autorNombre: "Recepción",
    },
  });
  return !guardado.error;
}

async function registrarPasoFacturada(
  schema: string,
  cuenta: string,
  idOrden: string,
  estadoAnterior: string,
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (!admin || !cuenta || !idOrden) return false;
  const guardado = await admin.schema(schema).from("auditoria_operacion").insert({
    codigo_cuenta: cuenta,
    id_bodega: null,
    id_usuario: null,
    accion: "cambio_estado",
    entidad: "orden_venta",
    entidad_id: idOrden,
    payload: {
      mensaje: "Estado de la orden actualizado a Facturado.",
      tipo: "cambio_estado",
      estadoAnterior,
      estadoNuevo: "facturada",
      autorNombre: "Recepción",
    },
  });
  return !guardado.error;
}

async function marcarFacturada(schema: string, ov: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (!admin) return false;
  const actualizado = await admin
    .schema(schema)
    .from("orden_venta")
    .update({ estado: "facturada", updated_at: new Date().toISOString() })
    .eq("codigo", ov.trim())
    .select("codigo")
    .maybeSingle();
  return !actualizado.error && Boolean(actualizado.data?.codigo);
}
