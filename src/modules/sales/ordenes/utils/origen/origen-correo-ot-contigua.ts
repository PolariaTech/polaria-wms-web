import type { OrigenCorreoRenglon } from "./origen-correo-ordenes-trabajo";

function norm(value: string | null | undefined): string {
  return (value ?? "").toString().trim();
}

function normKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Clave semántica (pedido + centro de consumo + código de almacén).
 * REQ-238: el armado de OT además respeta bloques contiguos en el documento.
 */
export function baseGroupKeyOrigenCorreo(renglon: OrigenCorreoRenglon): string {
  const otId = norm(renglon._otId);
  if (otId) return otId;

  const pedido = norm(renglon["Numero pedido"]);
  const almacen = norm(renglon.Almacen);
  const numeroAlmacen = norm(renglon["Numero almacen"]);
  const referencia = norm(renglon["Referencia pedido"]);

  if (pedido || almacen) {
    const num =
      numeroAlmacen && numeroAlmacen !== "_"
        ? `|numAlmacen:${normKey(numeroAlmacen)}`
        : "";
    return `pedido:${pedido ? normKey(pedido) : "_"}|almacen:${almacen ? normKey(almacen) : "_"}${num}`;
  }
  if (referencia) return `ref:${normKey(referencia)}`;
  return "default";
}

/**
 * REQ-238: misma cocina/pedido no contigua (tras otra cocina) = otra OT.
 * Filas con `_otId` manual se respetan tal cual.
 */
export function contiguousOtIdsForRenglones(
  renglones: readonly OrigenCorreoRenglon[],
): string[] {
  const ids: string[] = [];
  let lastAutoBase: string | null = null;
  let bloqueSeq = 0;

  for (const row of renglones) {
    const manualOtId = norm(row._otId);
    if (manualOtId) {
      ids.push(manualOtId);
      lastAutoBase = null;
      continue;
    }

    const base = baseGroupKeyOrigenCorreo({ ...row, _otId: undefined });
    if (base !== lastAutoBase) {
      bloqueSeq += 1;
      lastAutoBase = base;
    }
    ids.push(
      base === "default" ? "default" : `${base}|bloque:${bloqueSeq}`,
    );
  }

  return ids;
}

/** REQ-238: OT ids contiguos desde líneas IA del pedido (sin pasar por OrigenCorreo). */
export function contiguousOtIdsFromPedidoLineas(
  lineas: ReadonlyArray<{
    numeroPedido?: string | null;
    almacen?: string | null;
    numeroAlmacen?: string | null;
    referenciaPedido?: string | null;
  }>,
): string[] {
  return contiguousOtIdsForRenglones(
    lineas.map((linea) => ({
      "Numero pedido": linea.numeroPedido || "",
      Almacen: linea.almacen || "",
      "Numero almacen": linea.numeroAlmacen || "",
      "Referencia pedido": linea.referenciaPedido || "",
    })),
  );
}
