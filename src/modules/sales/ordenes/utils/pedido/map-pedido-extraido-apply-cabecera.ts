import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import { sanitizeTelefonoContacto } from "./sanitize-telefono-contacto";
import { formatCapturaFecha } from "./build-orden-venta-captura-observaciones";
import { parseFechaOrigen } from "../origen/materialize-ov-desde-origen";
import {
  extractDireccionShipToDesdeTexto,
  extractEntregaDesdeTexto,
} from "./extract-entrega-desde-texto";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  FECHA_ENTREGA_DEFAULT_WARNING,
  isFechaEntregaAtrasada,
} from "./pedido-form-validation";
import { resolveOrdenCompraLimpia } from "./normalize-numero-pedido";
import { asegurarNotasGeneralesPedido } from "../origen/sanitize-notas-generales-pedido";
import type { CampoDiscrepancia, PedidoIaFichaCabecera } from "./map-pedido-extraido-to-form.types";
import { compareOverride } from "./map-pedido-extraido-compare-override";

export interface CabeceraPatchResult {
  patch: Record<string, string>;
  autoFields: Set<string>;
  warnFields: Set<string>;
  discrepancias: CampoDiscrepancia[];
}

export function applyPedidoCabeceraToPatch(params: {
  pedido: PedidoExtraido;
  ficha: PedidoIaFichaCabecera;
  tomorrowIso: string;
  todayIso: string;
}): CabeceraPatchResult {
  const { pedido, ficha, tomorrowIso, todayIso } = params;
  const autoFields = new Set<string>();
  const warnFields = new Set<string>();
  const discrepancias: CampoDiscrepancia[] = [];
  const patch: Record<string, string> = {
    fechaEntrega: "",
    centroConsumo: ficha.centroConsumo,
    observaciones: ficha.observaciones,
    ordenCompraHotel: "",
    direccion: ficha.direccion,
    anden: ficha.anden,
    contacto: ficha.contacto,
    telefono: ficha.telefono,
    correo: ficha.correo,
    ventanaDesde: ficha.ventanaDesde,
    ventanaHasta: ficha.ventanaHasta,
    aceptaSustituciones: ficha.aceptaSustituciones,
    requiereLote: ficha.requiereLote,
    registrarTemperatura: ficha.registrarTemperatura,
  };

  for (const key of [
    "centroConsumo",
    "direccion",
    "anden",
    "contacto",
    "telefono",
    "correo",
    "ventanaDesde",
    "ventanaHasta",
    "aceptaSustituciones",
    "requiereLote",
    "registrarTemperatura",
    "observaciones",
  ] as const) {
    if (patch[key]) autoFields.add(key);
  }

  // Fecha/hora del cuerpo u origen_correo mandan sobre el default de mañana.
  const fechaFromOrigen = (() => {
    for (const row of pedido.origenCorreo ?? []) {
      const raw =
        row && typeof row === "object" && "Fecha" in row
          ? String((row as { Fecha?: unknown }).Fecha ?? "")
          : "";
      const parsed = parseFechaOrigen(raw);
      if (parsed) return parsed;
    }
    return null;
  })();
  const fromBody = extractEntregaDesdeTexto(
    [
      pedido.textoOrigen,
      pedido.observaciones,
      pedido.notasGeneralesAlmacen,
    ]
      .filter(Boolean)
      .join("\n"),
    todayIso,
  );
  const fechaLeida =
    pedido.fechaEntrega?.trim() || fechaFromOrigen || fromBody.fechaIso || null;
  const fechaPorDefecto = !fechaLeida;
  const fecha = fechaLeida || tomorrowIso;
  patch.fechaEntrega = fecha;
  if (isFechaEntregaAtrasada(fecha, todayIso)) {
    warnFields.add("fechaEntrega");
    autoFields.delete("fechaEntrega");
    discrepancias.push({
      campo: "Fecha de entrega",
      fieldKey: "fechaEntrega",
      db: "Hoy o posterior",
      ia: `${formatCapturaFecha(fecha)} · ${FECHA_ENTREGA_ATRASADA_WARNING}`,
    });
  } else if (fechaPorDefecto) {
    warnFields.add("fechaEntrega");
    autoFields.delete("fechaEntrega");
    discrepancias.push({
      campo: "Fecha de entrega",
      fieldKey: "fechaEntrega",
      db: "Leída del correo",
      ia: `${formatCapturaFecha(fecha)} · ${FECHA_ENTREGA_DEFAULT_WARNING}`,
    });
  } else {
    autoFields.add("fechaEntrega");
  }

  const horarioDesdeIa =
    pedido.horarioDesde?.trim() || fromBody.horarioDesde || null;
  const horarioHastaIa =
    pedido.horarioHasta?.trim() || fromBody.horarioHasta || null;

  {
    const occ = resolveOrdenCompraLimpia(
      pedido.ordenCompraHotel,
      pedido.textoOrigen ?? "",
    );
    if (occ) {
      patch.ordenCompraHotel = occ;
      autoFields.add("ordenCompraHotel");
    }
  }
  // El documento manda (ej. Subject «…COMEDOR…»); la ficha solo rellena huecos.
  // preferFicha aquí dejaba la denominación comercial de la ficha (ej. «hilton waldorf»)
  // por encima del área real del pedido.
  compareOverride({
    fieldKey: "centroConsumo",
    valorDb: ficha.centroConsumo,
    valorIa: pedido.centroConsumo,
    patch,
    autoFields,
    warnFields,
  });
  // Entrega: Ship To del texto manda; luego Mateo; ficha solo si no hay dato.
  const direccionShipTo = extractDireccionShipToDesdeTexto(
    [
      pedido.textoOrigen,
      pedido.observaciones,
      pedido.notasGeneralesAlmacen,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  compareOverride({
    fieldKey: "direccion",
    valorDb: ficha.direccion,
    valorIa: direccionShipTo || pedido.direccion,
    patch,
    autoFields,
    warnFields,
  });
  compareOverride({
    fieldKey: "anden",
    valorDb: ficha.anden,
    valorIa: pedido.anden,
    patch,
    autoFields,
    warnFields,
  });
  compareOverride({
    fieldKey: "contacto",
    valorDb: ficha.contacto,
    valorIa: pedido.contacto,
    patch,
    autoFields,
    warnFields,
  });
  compareOverride({
    fieldKey: "telefono",
    valorDb: sanitizeTelefonoContacto(ficha.telefono),
    valorIa: sanitizeTelefonoContacto(pedido.telefono) || null,
    patch,
    autoFields,
    warnFields,
  });
  compareOverride({
    fieldKey: "correo",
    valorDb: ficha.correo,
    valorIa: pedido.correo,
    patch,
    autoFields,
    warnFields,
  });
  compareOverride({
    fieldKey: "ventanaDesde",
    valorDb: ficha.ventanaDesde,
    valorIa: horarioDesdeIa,
    patch,
    autoFields,
    warnFields,
  });
  compareOverride({
    fieldKey: "ventanaHasta",
    valorDb: ficha.ventanaHasta,
    valorIa: horarioHastaIa,
    patch,
    autoFields,
    warnFields,
  });
  compareOverride({
    fieldKey: "aceptaSustituciones",
    valorDb: ficha.aceptaSustituciones,
    valorIa: pedido.sustituciones,
    patch,
    autoFields,
    warnFields,
    preferFicha: true,
  });
  compareOverride({
    fieldKey: "requiereLote",
    valorDb: ficha.requiereLote,
    valorIa: pedido.lote,
    patch,
    autoFields,
    warnFields,
    preferFicha: true,
  });
  compareOverride({
    fieldKey: "registrarTemperatura",
    valorDb: ficha.registrarTemperatura,
    valorIa: pedido.temperatura,
    patch,
    autoFields,
    warnFields,
    preferFicha: true,
  });

  // REQ-340: Mateo (o scrap del origen) siempre deja algo en notas; el usuario puede
  // sobrescribir después. No usar asegurar al reabrir OV con borrado intencional.
  const notasIa =
    pedido.notasGeneralesAlmacen?.trim() ||
    pedido.observaciones?.trim() ||
    "";
  patch.observaciones = asegurarNotasGeneralesPedido(
    notasIa,
    pedido.textoOrigen,
  );
  autoFields.add("observaciones");

  return { patch, autoFields, warnFields, discrepancias };
}