import type { PedidoExtraido } from "../ai/openai-pedido.client";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import {
  aplicarEmpaqueInicialLinea,
  collectMissingFieldsDocs,
  type CampoOperativoDocs,
} from "./empaque-lineas";

export interface LineaVentaFromIa {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  cantidadInput: string;
  cajasInput: string;
  presentacion: string;
  especificacion: string;
  descuentoPctInput: string;
  ivaPct: string;
  kgDisponible: number;
  precioUnitario: number;
  aliasCliente: string;
  filledByIa: boolean;
  packHint?: string;
  autoPackFields?: Array<"cajasInput" | "presentacion" | "cantidadInput">;
}

export interface CampoDiscrepancia {
  campo: string;
  db: string;
  ia: string;
}

export interface PedidoIaFormPatch {
  fechaEntrega: string;
  centroConsumo: string;
  observaciones: string;
  ordenCompraHotel: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  ventanaDesde: string;
  ventanaHasta: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  autoFields: Set<string>;
  warnFields: Set<string>;
  missingFields: Set<string>;
  discrepancias: CampoDiscrepancia[];
  lineas: LineaVentaFromIa[];
  advertencia: string | null;
  archivosNoLegibles: string[];
}

const PRESENTACION_SET = new Set([
  "",
  "Caja 1.5 kg",
  "Caja 20 kg",
  "Caja 21 kg",
  "Granel",
]);

function catalogKey(nombre: string, codigo: string): string {
  return `${nombre} (${codigo})`;
}

function norm(value: string | null | undefined): string {
  return (value ?? "").toString().trim().toLowerCase();
}

function compareOverride(params: {
  fieldKey: string;
  label: string;
  valorDb: string;
  valorIa: string | null | undefined;
  patch: Record<string, string>;
  autoFields: Set<string>;
  warnFields: Set<string>;
  discrepancias: CampoDiscrepancia[];
}): void {
  const { fieldKey, label, valorDb, valorIa, patch, autoFields, warnFields, discrepancias } =
    params;
  if (valorIa == null || !String(valorIa).trim()) {
    return;
  }
  const ia = String(valorIa).trim();
  patch[fieldKey] = ia;
  if (norm(valorDb) === norm(ia)) {
    autoFields.add(fieldKey);
    warnFields.delete(fieldKey);
    return;
  }
  if (valorDb.trim()) {
    warnFields.add(fieldKey);
    autoFields.delete(fieldKey);
    discrepancias.push({ campo: label, db: valorDb || "—", ia });
  } else {
    autoFields.add(fieldKey);
  }
}

/**
 * Traduce PedidoExtraido al estado del modal, respetando:
 * ficha del cliente primero; si la IA trae valor distinto, gana el pedido (warn).
 */
export function mapPedidoExtraidoToForm(params: {
  pedido: PedidoExtraido;
  productos: ProductoVentaOption[];
  ficha: {
    centroConsumo: string;
    ventanaDesde: string;
    ventanaHasta: string;
    direccion: string;
    anden: string;
    contacto: string;
    telefono: string;
    aceptaSustituciones: string;
    requiereLote: string;
    registrarTemperatura: string;
    observaciones: string;
  };
  tomorrowIso: string;
}): PedidoIaFormPatch {
  const { pedido, productos, ficha, tomorrowIso } = params;
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
    "ventanaDesde",
    "ventanaHasta",
    "aceptaSustituciones",
    "requiereLote",
    "registrarTemperatura",
    "observaciones",
  ] as const) {
    if (patch[key]) autoFields.add(key);
  }

  const fecha = pedido.fechaEntrega?.trim() || tomorrowIso;
  patch.fechaEntrega = fecha;
  autoFields.add("fechaEntrega");

  if (pedido.ordenCompraHotel?.trim()) {
    patch.ordenCompraHotel = pedido.ordenCompraHotel.trim();
    autoFields.add("ordenCompraHotel");
  }
  compareOverride({
    fieldKey: "centroConsumo",
    label: "Centro de consumo",
    valorDb: ficha.centroConsumo,
    valorIa: pedido.centroConsumo,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "direccion",
    label: "Dirección de entrega",
    valorDb: ficha.direccion,
    valorIa: pedido.direccion,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "anden",
    label: "Andén",
    valorDb: ficha.anden,
    valorIa: pedido.anden,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "contacto",
    label: "Contacto",
    valorDb: ficha.contacto,
    valorIa: pedido.contacto,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "telefono",
    label: "Teléfono",
    valorDb: ficha.telefono,
    valorIa: pedido.telefono,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "ventanaDesde",
    label: "Ventana desde",
    valorDb: ficha.ventanaDesde,
    valorIa: pedido.horarioDesde,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "ventanaHasta",
    label: "Ventana hasta",
    valorDb: ficha.ventanaHasta,
    valorIa: pedido.horarioHasta,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "aceptaSustituciones",
    label: "Sustituciones",
    valorDb: ficha.aceptaSustituciones,
    valorIa: pedido.sustituciones,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "requiereLote",
    label: "Requiere lote",
    valorDb: ficha.requiereLote,
    valorIa: pedido.lote,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "registrarTemperatura",
    label: "Registrar temperatura",
    valorDb: ficha.registrarTemperatura,
    valorIa: pedido.temperatura,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });

  if (pedido.observaciones?.trim()) {
    const obsIa = pedido.observaciones.trim();
    if (ficha.observaciones.trim() && norm(ficha.observaciones) !== norm(obsIa)) {
      patch.observaciones = [ficha.observaciones.trim(), obsIa].join("\n");
      warnFields.add("observaciones");
      autoFields.delete("observaciones");
      discrepancias.push({
        campo: "Observaciones",
        db: ficha.observaciones,
        ia: obsIa,
      });
    } else {
      patch.observaciones = obsIa;
      autoFields.add("observaciones");
    }
  }

  const byKey = new Map(
    productos.map((p) => [catalogKey(p.nombre, p.codigo), p] as const),
  );

  const lineas: LineaVentaFromIa[] = [];
  const seen = new Set<string>();

  for (const linea of pedido.lineas) {
    const match = linea.productoCatalogo
      ? byKey.get(linea.productoCatalogo)
      : undefined;
    if (!match || seen.has(match.idProducto)) {
      continue;
    }
    seen.add(match.idProducto);

    const presentacion =
      linea.presentacion && PRESENTACION_SET.has(linea.presentacion)
        ? linea.presentacion
        : "";

    const baseLinea = {
      cajasInput:
        linea.cajas != null && Number.isFinite(linea.cajas)
          ? String(linea.cajas)
          : "",
      presentacion,
      cantidadInput:
        linea.cantidad != null && Number.isFinite(linea.cantidad)
          ? String(linea.cantidad)
          : "",
    };
    const empaque = aplicarEmpaqueInicialLinea(baseLinea);

    lineas.push({
      idProducto: match.idProducto,
      nombre: match.nombre,
      codigo: match.codigo,
      idBodega: match.idBodega,
      cantidadInput: empaque.cantidadInput,
      cajasInput: empaque.cajasInput,
      presentacion: empaque.presentacion,
      especificacion: linea.especificacion?.trim() || "",
      descuentoPctInput: "0",
      ivaPct: "0",
      kgDisponible: match.kgDisponible,
      precioUnitario: match.precioUnitario,
      aliasCliente: linea.textoOriginal?.trim() || "",
      filledByIa: true,
      packHint: empaque.packHint,
      autoPackFields: empaque.autoPackFields,
    });
  }

  const operativoValues = {
    fechaEntrega: patch.fechaEntrega,
    centroConsumo: patch.centroConsumo,
    direccion: patch.direccion,
    anden: patch.anden,
    contacto: patch.contacto,
    telefono: patch.telefono,
    ventanaDesde: patch.ventanaDesde,
    ventanaHasta: patch.ventanaHasta,
  } satisfies Record<CampoOperativoDocs, string>;

  const missingFields = collectMissingFieldsDocs(operativoValues);

  return {
    fechaEntrega: patch.fechaEntrega,
    centroConsumo: patch.centroConsumo,
    observaciones: patch.observaciones,
    ordenCompraHotel: patch.ordenCompraHotel,
    direccion: patch.direccion,
    anden: patch.anden,
    contacto: patch.contacto,
    telefono: patch.telefono,
    ventanaDesde: patch.ventanaDesde,
    ventanaHasta: patch.ventanaHasta,
    aceptaSustituciones: patch.aceptaSustituciones,
    requiereLote: patch.requiereLote,
    registrarTemperatura: patch.registrarTemperatura,
    autoFields,
    warnFields,
    missingFields,
    discrepancias,
    lineas,
    advertencia: pedido.advertencia,
    archivosNoLegibles: pedido.archivosNoLegibles ?? [],
  };
}
