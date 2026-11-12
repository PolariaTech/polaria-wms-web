import { completarAlmacenDelPedido } from "./completar-almacen-del-pedido";
import { filtrarRenglonesOrigenPedibles } from "./renglon-origen-pedible";

import {
  baseGroupKeyOrigenCorreo,
  contiguousOtIdsForRenglones,
} from "./origen-correo-ot-contigua";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "./origen-correo-renglon";

export type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "./origen-correo-renglon";
export {
  isOrigenCorreoArray,
  normalizeIdOrdenTrabajo,
  parseIdOrdenTrabajoFields,
  parseOrigenCorreoJson,
} from "./origen-correo-renglon";

/**
 * Agrupa renglones de origen_correo en órdenes de trabajo (hijas) de una OV.
 *
 * Clave base = Numero pedido + Almacen (+ Numero almacen si viene).
 * REQ-238: además se respetan bloques contiguos en el orden del documento
 * (misma cocina que reaparece tras otra = OT nueva).
 */

function norm(value: string | null | undefined): string {
  return (value ?? "").toString().trim();
}

function parseCantidad(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numero = Number(value.replace(",", ".").trim());
    return Number.isFinite(numero) ? numero : 0;
  }
  return 0;
}

export function groupKeyOrigenCorreo(renglon: OrigenCorreoRenglon): string {
  return baseGroupKeyOrigenCorreo(renglon);
}

export {
  baseGroupKeyOrigenCorreo,
  contiguousOtIdsForRenglones,
} from "./origen-correo-ot-contigua";

function labelFromGroup(
  key: string,
  renglones: OrigenCorreoRenglon[],
): string {
  const first = renglones[0];
  if (!first) return "Orden de trabajo";
  const pedido = norm(first["Numero pedido"]);
  const ref = norm(first["Referencia pedido"]);
  const almacen = norm(first.Almacen);

  let destino = almacen;
  if (!destino && ref) {
    const matchFyv = ref.match(/FYV\s+(.+?)\s+PARA\s+ENTREGA/i);
    destino = matchFyv?.[1]?.trim() || ref;
  }

  if (pedido && destino) return `${pedido} — ${destino}`;
  if (destino) return destino;
  if (pedido) return pedido;
  if (key === "default") return "Orden de trabajo";
  return key.replace(/^(pedido|almacen|ref):/, "");
}

export function groupOrigenCorreoToOrdenesTrabajo(
  renglones: readonly OrigenCorreoRenglon[] | null | undefined,
): OrdenTrabajoHija[] {
  if (!renglones || renglones.length === 0) return [];

  // REQ-234: no mostrar en OT hijas productos con cantidad 0.
  const pedibles = completarAlmacenDelPedido(
    filtrarRenglonesOrigenPedibles(renglones),
  );
  if (pedibles.length === 0) return [];

  const otIds = contiguousOtIdsForRenglones(pedibles);
  const buckets = new Map<string, OrigenCorreoRenglon[]>();
  pedibles.forEach((row, index) => {
    const key = otIds[index] ?? groupKeyOrigenCorreo(row);
    const list = buckets.get(key);
    if (list) list.push(row);
    else buckets.set(key, [row]);
  });

  // Orden de aparición en el documento (REQ-238), no alfabético.
  const hijas: OrdenTrabajoHija[] = [];
  for (const [key, rows] of buckets) {
    const first = rows[0]!;
    hijas.push({
      id: key,
      label: labelFromGroup(key, rows),
      numeroPedido: norm(first["Numero pedido"]),
      almacen: norm(first.Almacen),
      referenciaPedido: norm(first["Referencia pedido"]),
      fecha: norm(first.Fecha),
      responsableExterno: norm(first["Responsable externo"]),
      renglones: rows,
      totalCantidad: rows.reduce(
        (sum, row) => sum + parseCantidad(row.Cantidad),
        0,
      ),
    });
  }

  return hijas;
}

function newManualOtId(): string {
  const uuid =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `ot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `manual:${uuid}`;
}

/** Crea una OT vacía (para que el operador agregue tareas que Mateo no detectó). */
export function createEmptyOrdenTrabajoHija(input?: {
  id?: string;
  almacen?: string;
  numeroPedido?: string;
  fecha?: string;
  referenciaPedido?: string;
  responsableExterno?: string;
}): OrdenTrabajoHija {
  const idOt = norm(input?.id) || newManualOtId();
  const almacen = norm(input?.almacen);
  const numeroPedido = norm(input?.numeroPedido);
  const fecha = norm(input?.fecha);
  const referenciaPedido = norm(input?.referenciaPedido);
  const responsableExterno = norm(input?.responsableExterno);
  const renglon: OrigenCorreoRenglon = {
    _otId: idOt,
    Almacen: almacen,
    "Numero pedido": numeroPedido,
    Fecha: fecha,
    "Referencia pedido": referenciaPedido,
    "Responsable externo": responsableExterno,
    Producto: "",
    Cantidad: 0,
  };
  const label =
    (numeroPedido && almacen
      ? `${numeroPedido} — ${almacen}`
      : almacen || numeroPedido) || "Nueva orden de trabajo";
  return {
    id: idOt,
    label,
    numeroPedido,
    almacen,
    referenciaPedido,
    fecha,
    responsableExterno,
    renglones: [renglon],
    totalCantidad: 0,
  };
}

/** Aplana hijas → origen_correo, sellando `_otId` para no perder OTs manuales. */
export function flattenOrdenesTrabajoToOrigenCorreo(
  hijas: readonly OrdenTrabajoHija[],
): OrigenCorreoRenglon[] {
  const out: OrigenCorreoRenglon[] = [];
  for (const hija of hijas) {
    const rows =
      hija.renglones.length > 0
        ? hija.renglones
        : [{ Producto: "", Cantidad: 0 }];
    for (const row of rows) {
      out.push({
        ...row,
        _otId: hija.id,
        Almacen: hija.almacen || row.Almacen,
        "Numero pedido": hija.numeroPedido || row["Numero pedido"],
        Fecha: hija.fecha || row.Fecha,
        "Referencia pedido":
          hija.referenciaPedido || row["Referencia pedido"],
        "Responsable externo":
          hija.responsableExterno || row["Responsable externo"],
      });
    }
  }
  return out;
}

export {
  buildOrigenCorreoFromOrdenesYLineas,
  type LineaOrigenOtSync,
} from "./origen-correo-build-from-form";

export { indexIdProductoVerificadoOrigen } from "./origen-correo-id-producto-verificado";
