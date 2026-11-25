import type { OrdenSurtidoCapturaPayload } from "../../surtido/orden-surtido.types";
import { parseCantidadPreparadaKg } from "../../surtido/sync-surtido-to-orden-venta";
import { filterLineasByOrdenTrabajoHija } from "../../utils/ot/filter-lineas-by-orden-trabajo";
import {
  normalizeIdOrdenTrabajo,
  type OrdenTrabajoHija,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";

export type CapturaApiRow = {
  idOrdenTrabajo?: string;
  payload?: OrdenSurtidoCapturaPayload;
  urlFoto?: string | null;
  updatedAt?: string;
};

export interface FilaAlistado {
  key: string;
  otLabel: string;
  destino: string;
  despacho: string;
  fecha: string | null;
}

export interface ResumenLineasAlistado {
  completas: number;
  parciales: number;
  noSurtidas: number;
  totalLineas: number;
}

export function campoCaptura(
  campos: Record<string, string> | undefined,
  ...keys: string[]
): string {
  if (!campos) return "";
  for (const key of keys) {
    const direct = campos[key]?.trim();
    if (direct) return direct;
  }
  const lower = Object.fromEntries(
    Object.entries(campos).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const key of keys) {
    const value = lower[key.toLowerCase()]?.trim();
    if (value) return value;
  }
  return "";
}

export function buildCapturaByOtMap(
  capturas: readonly CapturaApiRow[],
): Map<string, CapturaApiRow> {
  const map = new Map<string, CapturaApiRow>();
  for (const row of capturas) {
    const key = normalizeIdOrdenTrabajo(row.idOrdenTrabajo);
    if (!map.has(key)) map.set(key, row);
  }
  return map;
}

export function resolveOtsAlistado(
  hijas: readonly OrdenTrabajoHija[],
  orden: Pick<OrdenVentaDetalleRow, "centro_consumo" | "orden_compra_hotel">,
): OrdenTrabajoHija[] {
  if (hijas.length > 0) return [...hijas];
  return [
    {
      id: "",
      label: orden.centro_consumo?.trim() || "Orden de trabajo",
      numeroPedido: orden.orden_compra_hotel?.trim() || "",
      almacen: orden.centro_consumo?.trim() || "",
      referenciaPedido: "",
      fecha: "",
      responsableExterno: "",
      renglones: [],
      totalCantidad: 0,
    } satisfies OrdenTrabajoHija,
  ];
}

export function buildFilasAlistado(
  ots: readonly OrdenTrabajoHija[],
  capturaByOt: ReadonlyMap<string, CapturaApiRow>,
  direccionEntrega: string | null | undefined,
): FilaAlistado[] {
  return ots.map((hija, index) => {
    const otKey = normalizeIdOrdenTrabajo(hija.id);
    const captura = capturaByOt.get(otKey) ?? capturaByOt.get("");
    const destino =
      hija.almacen?.trim() ||
      hija.label.split("—").slice(1).join("—").trim() ||
      hija.label ||
      direccionEntrega?.trim() ||
      "—";
    const despacho = campoCaptura(
      captura?.payload?.campos,
      "despachoNombre",
      "Despachó nombre",
      "Despachó",
    );
    return {
      key: hija.id || `ot-${index}`,
      otLabel: `TAREA ${index + 1}`,
      destino,
      despacho: despacho || "—",
      fecha: captura?.updatedAt ?? null,
    };
  });
}

export function resolveCerradoAtAlistado(
  capturas: readonly CapturaApiRow[],
  orden: Pick<
    OrdenVentaDetalleRow,
    "estado_desde" | "updated_at" | "created_at"
  >,
): string | null {
  const times = capturas
    .map((row) => Date.parse(row.updatedAt ?? ""))
    .filter((t) => Number.isFinite(t));
  if (times.length === 0) {
    return (
      orden.estado_desde?.trim() ||
      orden.updated_at?.trim() ||
      orden.created_at?.trim() ||
      null
    );
  }
  return new Date(Math.max(...times)).toISOString();
}

export function buildResumenLineasAlistado(
  ots: readonly OrdenTrabajoHija[],
  capturaByOt: ReadonlyMap<string, CapturaApiRow>,
  lineasOrden: OrdenVentaDetalleRow["lineas"],
): ResumenLineasAlistado | null {
  let completas = 0;
  let parciales = 0;
  let noSurtidas = 0;
  let conDatoPrep = 0;
  let totalLineas = 0;

  for (const hija of ots) {
    const otKey = normalizeIdOrdenTrabajo(hija.id);
    const captura = capturaByOt.get(otKey) ?? capturaByOt.get("");
    const lineasOt = filterLineasByOrdenTrabajoHija(
      lineasOrden ?? [],
      hija.renglones.length > 0 ? hija : null,
      { emptyFallback: hija.renglones.length === 0 ? "all" : "none" },
    );
    totalLineas += lineasOt.length;

    lineasOt.forEach((linea, lineaIndex) => {
      const prepRaw = captura?.payload?.lineas?.find(
        (row) => row.indice === lineaIndex + 1,
      )?.cantidadPreparada;
      const prep = parseCantidadPreparadaKg(prepRaw);
      if (prep == null) {
        noSurtidas += 1;
        return;
      }
      conDatoPrep += 1;
      const pedida = Number(linea.cantidad_pedida) || 0;
      if (pedida <= 0) {
        if (prep > 0) completas += 1;
        else noSurtidas += 1;
        return;
      }
      if (prep <= 0) {
        noSurtidas += 1;
        return;
      }
      if (prep + 1e-6 >= pedida) completas += 1;
      else parciales += 1;
    });
  }

  // Solo mostrar tarjetas si hay al menos una cantidad preparada leída.
  if (conDatoPrep === 0) return null;
  return { completas, parciales, noSurtidas, totalLineas };
}
