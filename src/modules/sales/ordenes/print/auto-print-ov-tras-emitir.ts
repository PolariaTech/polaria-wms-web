"use client";

import { useAuthStore } from "@/stores/auth.store";
import { normalizeEstadoOrdenVenta } from "../../shared/constants/sales-status";
import { getOrdenVentaDetalle } from "../../shared/services/sales.service";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import { postOrdenVentaLogForOts } from "../services/orden-venta-log.client";
import { printOrdenTareaAlmacenLandscape } from "./download-orden-tarea-almacen-pdf";
import { mapOrdenVentaToAlmacenPrintSheets } from "./map-orden-tarea-almacen";
import {
  MENSAJE_VERSION_NUEVA,
  esErrorDeVersionVieja,
} from "./print-correo-fallo";
import {
  printNotQueuedDetail,
  printQueueLogMensaje,
  printQueuePayload,
  printQueueUserMessage,
  type PrintQueueOutcome,
} from "./print-queue-status";

export type AutoPrintOvResult =
  | { status: "skipped"; reason: "flag_off" | "no_sheets" }
  | {
      status: "ok";
      hojas: number;
      codigo?: string;
      impresora: string;
      queue: PrintQueueOutcome;
    }
  | { status: "error"; message: string };

/** Fila mínima para PDF de almacén tras emitir (detalle es la fuente fiable). */
export function resolveListRowForAutoPrint(
  detalle: OrdenVentaDetalleRow,
  fallback: OrdenVentaOperadorRow | null,
): OrdenVentaOperadorRow {
  if (
    fallback &&
    typeof fallback.idOrdenVenta === "string" &&
    fallback.idOrdenVenta === detalle.id_orden_venta &&
    typeof fallback.venta === "string"
  ) {
    return {
      ...fallback,
      estado: normalizeEstadoOrdenVenta(detalle.estado),
      venta: detalle.codigo || fallback.venta,
      fecha: detalle.created_at || detalle.fecha_pedido || fallback.fecha,
      destino:
        detalle.bodega_destino_nombre?.trim() ||
        (fallback.destino !== "—" ? fallback.destino : "—"),
      comprador:
        detalle.comprador_nombre?.trim() ||
        (fallback.comprador !== "—" ? fallback.comprador : "—"),
    };
  }

  const occ = detalle.orden_compra_hotel?.trim() || "";
  return {
    idOrdenVenta: detalle.id_orden_venta,
    venta: detalle.codigo,
    occ: occ || "—",
    occTodas: occ ? [occ] : [],
    cuenta: detalle.codigo_cuenta,
    comprador: detalle.comprador_nombre?.trim() || "—",
    productos: "—",
    cantidadKg: 0,
    total: 0,
    estado: normalizeEstadoOrdenVenta(detalle.estado),
    fecha: detalle.created_at || detalle.fecha_pedido,
    ordenesTrabajo: 1,
    destino: detalle.bodega_destino_nombre?.trim() || "—",
    idBodega: detalle.id_bodega,
    idBodegaDestino: detalle.id_bodega_destino,
    slaStatus: "en_tiempo",
    alertaStatus: "ok",
    minutosEnEstado: 0,
    slaMinutos: 60,
    alertaMinutos: 45,
  };
}

export async function fetchAutoImprimirFlag(
  codigoCuenta: string,
): Promise<boolean> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error("Sesión requerida.");
  }

  const qs = new URLSearchParams({ codigoCuenta });
  const response = await fetch(
    `/api/ventas/cuenta-auto-imprimir?${qs.toString()}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    autoImprimir?: boolean;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.error || "No se pudo leer la configuración de autoimpresión.",
    );
  }

  return Boolean(data.autoImprimir);
}

/**
 * Si la cuenta tiene autoimpresión, genera el PDF de almacén y lo envía
 * a la impresora (email Brother / IPP / QZ). No lanza: devuelve resultado.
 */
export async function autoPrintOrdenVentaTrasEmitir(input: {
  codigoCuenta: string;
  idOrdenVenta: string;
  listRowFallback?: OrdenVentaOperadorRow | null;
  autorNombre?: string | null;
  idUsuario?: string | null;
  /** Si ya se leyó el flag en el caller, evita otra round-trip. */
  autoImprimirKnown?: boolean;
}): Promise<AutoPrintOvResult> {
  const codigoCuenta = input.codigoCuenta.trim();
  const idOrdenVenta = input.idOrdenVenta.trim();
  if (!codigoCuenta || !idOrdenVenta) {
    return {
      status: "error",
      message: "Faltan cuenta u orden para autoimprimir.",
    };
  }

  try {
    const autoImprimir =
      input.autoImprimirKnown ?? (await fetchAutoImprimirFlag(codigoCuenta));
    if (!autoImprimir) {
      return { status: "skipped", reason: "flag_off" };
    }

    const detallePrint = await getOrdenVentaDetalle({
      codigoCuenta,
      idOrdenVenta,
    });
    const listRow = resolveListRowForAutoPrint(
      detallePrint,
      input.listRowFallback ?? null,
    );
    const sheets = mapOrdenVentaToAlmacenPrintSheets({
      listRow,
      detalle: detallePrint,
    });
    if (sheets.length === 0) {
      return { status: "skipped", reason: "no_sheets" };
    }

    const printed = await printOrdenTareaAlmacenLandscape(sheets, {
      codigoCuenta,
    });

    const autor = input.autorNombre?.trim() || "usuario";
    const otIds = sheets.map((sheet) => sheet.idOrdenTrabajo);
    void postOrdenVentaLogForOts({
      idOrdenVenta,
      codigoCuenta,
      accion: "actualizacion",
      mensaje: printQueueLogMensaje({
        outcome: printed.queue,
        impresora: printed.impresora,
        autor,
        auto: true,
      }),
      idUsuario: input.idUsuario ?? null,
      autorNombre: input.autorNombre ?? null,
      idBodega: listRow.idBodega ?? null,
      idOrdenesTrabajo: otIds,
      payloadExtra: printQueuePayload({
        tipo: "impresion_pdf_auto",
        hojas: sheets.length,
        impresora: printed.impresora,
        outcome: printed.queue,
      }),
    });

    return {
      status: "ok",
      hojas: sheets.length,
      codigo: listRow.venta?.trim() || detallePrint.codigo?.trim() || undefined,
      impresora: printed.impresora,
      queue: printed.queue,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo autoimprimir tras confirmar.";
    console.error("[ov] auto-print tras validar falló:", message);
    return { status: "error", message };
  }
}

export function autoPrintResultToFeedback(result: AutoPrintOvResult): {
  ok: boolean;
  title: string;
  detail: string;
  line: string;
  /** La pestaña corre una versión vieja de la página: basta con recargarla (REQ-189). */
  versionVieja?: boolean;
} | null {
  if (result.status === "skipped") return null;
  if (result.status === "ok") {
    const message = printQueueUserMessage({
      outcome: result.queue,
      impresora: result.impresora,
      codigo: result.codigo,
      hojas: result.hojas,
    });
    return { ok: true, ...message };
  }
  if (esErrorDeVersionVieja(result.message)) {
    return {
      ok: false,
      title: "Recarga la página",
      detail: MENSAJE_VERSION_NUEVA,
      line: MENSAJE_VERSION_NUEVA,
      versionVieja: true,
    };
  }
  const sinImpresora = result.message.includes("impresora configurada");
  if (sinImpresora) {
    const detail =
      "Contacta a TI de Polaria para configurar la impresora de esta cuenta.";
    return {
      ok: false,
      title: "Sin impresora configurada",
      detail,
      line: `Sin impresora configurada. ${detail}`,
    };
  }
  const detail = printNotQueuedDetail(result.message);
  return {
    ok: false,
    title: "No se pudo imprimir",
    detail,
    line: detail,
  };
}
