const CLAVES_FOLIO_FACTURA = [
  "facturaOkFolio",
  "facturaAsociada",
  "Folio factura asociada",
  "Factura (OK) folio",
  "Documentación folio",
  "Folio",
];

export function leerFolioFacturaVista(
  campos: Record<string, string> | undefined,
): string {
  if (!campos) return "";
  for (const key of CLAVES_FOLIO_FACTURA) {
    const direct = campos[key]?.trim();
    if (direct) return direct;
  }
  const lower = Object.fromEntries(
    Object.entries(campos).map(([key, value]) => [key.toLowerCase(), value]),
  );
  for (const key of CLAVES_FOLIO_FACTURA) {
    const value = lower[key.toLowerCase()]?.trim();
    if (value) return value;
  }
  return "";
}

export function porcentajeDeNota(
  nota: string,
  etiqueta: "desc" | "IVA",
): number {
  const match = nota.match(
    new RegExp(`(?:^|·)\\s*${etiqueta}\\s+([\\d.,]+)\\s*%`, "i"),
  );
  if (!match?.[1]) return 0;
  const pct = Number(match[1].replace(",", "."));
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return etiqueta === "desc" ? Math.min(100, pct) : pct;
}

export function especificacionVisible(nota: string): string {
  return nota
    .replace(/(?:^|\s*·\s*)desc\s+[\d.,]+\s*%/gi, "")
    .replace(/(?:^|\s*·\s*)IVA\s+[\d.,]+\s*%/gi, "")
    .replace(/^\s*·\s*/, "")
    .replace(/\s*·\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function textoConteoOrdenesTrabajo(cantidad: number): string {
  if (cantidad === 1) return "1 orden de trabajo";
  return `${cantidad} órdenes de trabajo`;
}

/**
 * Título del detalle multi-OT: folio OV + guión + # de OT (1…N).
 * REQ-229 — ej. OV-00001047-2. Con una sola OT (o sin índice) solo el folio.
 */
export function tituloDetalleOvConOt(
  codigoOv: string | null | undefined,
  indiceOt1Based: number,
  totalOt: number,
): string {
  const codigo = (codigoOv ?? "").trim() || "OV";
  if (totalOt <= 1 || indiceOt1Based < 1) return codigo;
  return `${codigo}-${indiceOt1Based}`;
}

export type MontoLineaVista = {
  descuentoPct: number;
  ivaPct: number;
  especificacion: string;
  bruto: number;
  descuento: number;
  iva: number;
  importe: number;
};

export function montoDeNota(
  nota: string,
  cantidad: number,
  precio: number,
): MontoLineaVista {
  const descuentoPct = porcentajeDeNota(nota, "desc");
  const ivaPct = porcentajeDeNota(nota, "IVA");
  const bruto = cantidad * precio;
  const descuento = bruto * (descuentoPct / 100);
  const base = Math.max(0, bruto - descuento);
  const iva = base * (ivaPct / 100);
  return {
    descuentoPct,
    ivaPct,
    especificacion: especificacionVisible(nota),
    bruto,
    descuento,
    iva,
    importe: base,
  };
}

export function totalLineaConIva(
  cantidad: number,
  precio: number,
  nota: string,
): number {
  const monto = montoDeNota(nota, cantidad, precio);
  return monto.importe + monto.iva;
}

import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { OrdenVentaCapturaParsed } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import { sanitizeTelefonoContacto } from "../../utils/pedido/sanitize-telefono-contacto";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { resolveNumeroOrdenClientePrint } from "../../utils/ot/filter-lineas-by-orden-trabajo";

export { resolveNumeroOrdenClientePrint };

/** Campos de captura del detalle (REQ-176 OCC alineada al PDF). */
export function buildCapturaDetalleVista(
  orden: OrdenVentaDetalleRow,
  hija: OrdenTrabajoHija | null | undefined,
  fromObs: OrdenVentaCapturaParsed,
  tareaTotal: number,
  ventanaFlat: string,
): OrdenVentaCapturaParsed {
  return {
    ...fromObs,
    prioridad: orden.prioridad?.trim() || fromObs.prioridad,
    ordenCompraHotel: resolveNumeroOrdenClientePrint({
      ordenCompraHotel: orden.orden_compra_hotel,
      hijaNumeroPedido: hija?.numeroPedido,
      capturaOrdenCompra: fromObs.ordenCompraHotel,
      tareaTotal,
    }),
    centroConsumo:
      hija?.almacen || orden.centro_consumo?.trim() || fromObs.centroConsumo,
    moneda: orden.moneda?.trim() || fromObs.moneda,
    bodegaDestino:
      orden.bodega_destino_label?.trim() || fromObs.bodegaDestino,
    direccion: orden.direccion_entrega?.trim() || fromObs.direccion,
    anden: orden.anden?.trim() || fromObs.anden,
    contacto:
      hija?.responsableExterno ||
      orden.contacto_entrega?.trim() ||
      fromObs.contacto,
    telefono:
      sanitizeTelefonoContacto(orden.telefono_contacto) ||
      sanitizeTelefonoContacto(fromObs.telefono),
    correo: orden.correo_contacto?.trim() || fromObs.correo,
    turno: orden.turno?.trim() || fromObs.turno,
    horaSalida: orden.hora_salida?.trim() || fromObs.horaSalida,
    chofer: orden.chofer?.trim() || fromObs.chofer,
    unidad: orden.unidad?.trim() || fromObs.unidad,
    aceptaSustituciones:
      orden.acepta_sustituciones?.trim() || fromObs.aceptaSustituciones,
    requiereLote: orden.requiere_lote?.trim() || fromObs.requiereLote,
    registrarTemperatura:
      orden.registrar_temperatura?.trim() || fromObs.registrarTemperatura,
    fechaEntrega:
      hija?.fecha || orden.fecha_entrega?.trim() || fromObs.fechaEntrega,
    ventanaEntrega: ventanaFlat || fromObs.ventanaEntrega,
    notasLineas: orden.notas_lineas?.trim() || fromObs.notasLineas,
    origenTexto: orden.origen_texto?.trim() || fromObs.origenTexto,
  };
}
