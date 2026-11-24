import { sanitizeTelefonoContacto } from "./sanitize-telefono-contacto";

export interface OrdenVentaCapturaExtra {
  fechaEntrega: string;
  ventanaDesde: string;
  ventanaHasta: string;
  prioridad: string;
  ordenCompraHotel: string;
  centroConsumo: string;
  vendedor: string;
  observaciones: string;
  moneda: string;
  bodegaDestino: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  correo: string;
  turno: string;
  horaSalida: string;
  chofer: string;
  unidad: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  origenTexto: string;
  origenArchivos: readonly string[];
  notasLineas: string;
}

export interface OrdenVentaCapturaParsed {
  fechaEntrega: string;
  ventanaEntrega: string;
  prioridad: string;
  ordenCompraHotel: string;
  centroConsumo: string;
  vendedor: string;
  moneda: string;
  bodegaDestino: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  correo: string;
  turno: string;
  horaSalida: string;
  chofer: string;
  unidad: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  origenTexto: string;
  origenArchivos: string[];
  notasLineas: string;
  observaciones: string;
}

function pushLabeled(
  lines: string[],
  label: string,
  value: string,
  skipValues: readonly string[] = [],
): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (skipValues.includes(trimmed)) return;
  lines.push(`${label}: ${trimmed}`);
}

/** Arma el texto de observaciones con el pedido original y datos de captura. */
export function buildOrdenVentaCapturaObservaciones(
  extra: OrdenVentaCapturaExtra,
): string | null {
  const blocks: string[] = [];

  const origen = extra.origenTexto.trim();
  if (origen) {
    blocks.push(`Pedido original:\n${origen}`);
  }

  if (extra.origenArchivos.length > 0) {
    blocks.push(`Archivos: ${extra.origenArchivos.join(", ")}`);
  }

  const datos: string[] = [];
  pushLabeled(datos, "Fecha de entrega", extra.fechaEntrega);
  if (extra.ventanaDesde.trim() || extra.ventanaHasta.trim()) {
    datos.push(
      `Ventana de entrega: ${extra.ventanaDesde.trim() || "—"} – ${extra.ventanaHasta.trim() || "—"}`,
    );
  }
  pushLabeled(datos, "Prioridad", extra.prioridad, ["Normal"]);
  pushLabeled(datos, "Orden de compra del cliente", extra.ordenCompraHotel);
  pushLabeled(datos, "Centro de consumo", extra.centroConsumo);
  pushLabeled(datos, "Vendedor", extra.vendedor);
  pushLabeled(datos, "Moneda", extra.moneda);
  pushLabeled(datos, "Bodega destino", extra.bodegaDestino);
  pushLabeled(datos, "Dirección de entrega", extra.direccion);
  pushLabeled(datos, "Andén", extra.anden);
  pushLabeled(datos, "Contacto", extra.contacto);
  pushLabeled(datos, "Teléfono", sanitizeTelefonoContacto(extra.telefono));
  pushLabeled(datos, "Correo", extra.correo);
  pushLabeled(datos, "Sustituciones", extra.aceptaSustituciones);
  pushLabeled(datos, "Requiere lote", extra.requiereLote);
  pushLabeled(datos, "Registrar temperatura", extra.registrarTemperatura);

  if (datos.length > 0) {
    blocks.push(datos.join("\n"));
  }

  const notasLineas = extra.notasLineas.trim();
  if (notasLineas) {
    blocks.push(notasLineas);
  }

  const notas = extra.observaciones.trim();
  if (notas) {
    blocks.push(notas);
  }

  const text = blocks.join("\n\n").trim();
  return text || null;
}

export {
  emptyOrdenVentaCapturaParsed,
  parseOrdenVentaCapturaObservaciones,
} from "./build-orden-venta-captura-observaciones-ficha-parse";
