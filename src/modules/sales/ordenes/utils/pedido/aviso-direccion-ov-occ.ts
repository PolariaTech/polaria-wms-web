import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { isGarbageOcValue } from "./normalize-numero-pedido";

export type AdjuntoOrigenOc = {
  nombre: string;
  path?: string | null;
  mime?: string | null;
};

/** Rutas únicas de adjuntos .eml / message / .pdf candidatas a resolver OCC. */
export function extractOcAdjuntoPaths(
  origenAdjuntos: readonly AdjuntoOrigenOc[],
): string[] {
  return [
    ...new Set(
      origenAdjuntos
        .filter((item) => {
          if (!item.path?.trim()) return false;
          const name = item.nombre.toLowerCase();
          const mime = (item.mime ?? "").toLowerCase();
          return (
            name.endsWith(".eml") ||
            mime.includes("message") ||
            name.endsWith(".pdf")
          );
        })
        .map((item) => item.path!.trim()),
    ),
  ];
}

/** Aplica la misma OCC a hijas cuyo numeroPedido esté vacío o sea basura. */
export function applyOcSinMapaAOrdenesTrabajo(
  prev: OrdenTrabajoHija[],
  occ: string,
): { next: OrdenTrabajoHija[]; changed: boolean } {
  if (prev.length === 0) return { next: prev, changed: false };
  let changed = false;
  const next = prev.map((hija) => {
    const cur = hija.numeroPedido?.trim() || "";
    if (cur && !isGarbageOcValue(cur)) return hija;
    changed = true;
    return {
      ...hija,
      numeroPedido: occ,
      renglones: hija.renglones.map((row) => ({
        ...row,
        "Numero pedido": occ,
      })),
      label: occ && hija.almacen ? `${occ} — ${hija.almacen}` : hija.label,
    };
  });
  return { next: changed ? next : prev, changed };
}

/** Busca la OCC correspondiente a un almacén dentro del mapa por departamento. */
export function matchAlmacenEnMapaOc(
  almacen: string,
  byAlmacen: Record<string, string>,
): string {
  const alm = almacen.trim().toLowerCase();
  if (!alm) return "";
  for (const [dep, req] of Object.entries(byAlmacen)) {
    const depNormalizado = dep.trim().toLowerCase();
    if (!depNormalizado || !req) continue;
    if (
      alm.includes(depNormalizado) ||
      depNormalizado.includes(alm) ||
      alm === depNormalizado
    ) {
      return req;
    }
    // Match por código corto (CBEEFB vs CBEEFE BEEF BAR).
    const code = alm.split(/\s+/)[0] ?? "";
    const depCode = depNormalizado.split(/\s+/)[0] ?? "";
    if (
      code &&
      depCode &&
      (code.startsWith(depCode.slice(0, 5)) ||
        depCode.startsWith(code.slice(0, 5)))
    ) {
      return req;
    }
  }
  return "";
}

/** Aplica OCC por almacén a hijas que aún no tienen un numeroPedido válido. */
export function applyOcPorAlmacenAOrdenesTrabajo(
  prev: OrdenTrabajoHija[],
  byAlmacen: Record<string, string>,
): { next: OrdenTrabajoHija[]; changed: boolean } {
  if (prev.length === 0) return { next: prev, changed: false };
  let changed = false;
  const next = prev.map((hija) => {
    const matched = matchAlmacenEnMapaOc(hija.almacen || "", byAlmacen);
    if (!matched) return hija;
    const cur = hija.numeroPedido?.trim() || "";
    if (cur === matched || (!isGarbageOcValue(cur) && cur)) {
      return hija;
    }
    changed = true;
    return {
      ...hija,
      numeroPedido: matched,
      renglones: hija.renglones.map((row) => ({
        ...row,
        "Numero pedido": matched,
      })),
      label:
        matched && hija.almacen ? `${matched} — ${hija.almacen}` : hija.label,
    };
  });
  return { next: changed ? next : prev, changed };
}
