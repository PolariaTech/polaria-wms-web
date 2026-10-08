import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
} from "./origen-correo-ordenes-trabajo";

function pushUnique(target: string[], value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return;
  if (target.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
    return;
  }
  target.push(trimmed);
}

/** Parte OCC pegadas con coma / punto y coma / barra. */
function splitOccCandidates(raw: string): string[] {
  return raw
    .split(/[,;/|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * OCC (órdenes de compra del cliente) de una OV:
 * flat `orden_compra_hotel` + números de pedido de cada OT en origen_correo.
 * El primero es el visible en tabla; el resto queda para búsqueda.
 */
export function collectOrdenesCompraCliente(input: {
  ordenCompraHotel?: string | null;
  origenCorreo?: unknown;
}): string[] {
  const occ: string[] = [];

  const flat = input.ordenCompraHotel?.trim() ?? "";
  if (flat) {
    for (const part of splitOccCandidates(flat)) {
      pushUnique(occ, part);
    }
  }

  const hijas = groupOrigenCorreoToOrdenesTrabajo(
    parseOrigenCorreoJson(input.origenCorreo),
  );
  for (const hija of hijas) {
    pushUnique(occ, hija.numeroPedido);
  }

  return occ;
}

/**
 * Cantidad de órdenes de trabajo de la OV.
 * Sin origen_correo se cuenta 1 (la hoja única de la venta).
 */
export function countOrdenesTrabajo(origenCorreo: unknown): number {
  const hijas = groupOrigenCorreoToOrdenesTrabajo(
    parseOrigenCorreoJson(origenCorreo),
  );
  return hijas.length > 0 ? hijas.length : 1;
}
