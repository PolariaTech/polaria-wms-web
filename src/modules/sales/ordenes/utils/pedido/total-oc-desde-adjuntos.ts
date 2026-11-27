import type { OrigenAdjunto } from "../origen/origen-adjuntos";

/** Lo que devuelve `/api/ov-adjuntos/resolve-occ` para el total. */
export type RespuestaTotalAdjunto = {
  totalSolicitud?: number | null;
  /** REQ-425: total de cada OC del adjunto (un correo puede traer varias). */
  totalesPorOc?: Record<string, number> | null;
};

function esMonto(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0;
}

function normalizarOc(raw: string | null | undefined): string {
  const texto = (raw ?? "").trim();
  return texto.replace(/\D/g, "") || texto.toLowerCase();
}

/**
 * Total del pedido que corresponde a esta OV. Si el adjunto trae varias OC,
 * suma solo las de la OV; si ninguna es suya, no hay total (sería de otra OV).
 */
export function totalSolicitudDeLaOv(
  respuesta: RespuestaTotalAdjunto,
  ocsOv: readonly (string | null | undefined)[],
): number | null {
  const porOc = Object.entries(respuesta.totalesPorOc ?? {}).filter(
    ([oc, total]) => normalizarOc(oc) && esMonto(total),
  );
  const ocsPropias = new Set(ocsOv.map(normalizarOc).filter(Boolean));
  const propias = porOc.filter(([oc]) => ocsPropias.has(normalizarOc(oc)));
  if (propias.length > 0) {
    const suma = propias.reduce((acumulado, [, total]) => acumulado + total, 0);
    return Math.round(suma * 100) / 100;
  }
  if (porOc.length > 1) return null;
  return esMonto(respuesta.totalSolicitud) ? respuesta.totalSolicitud : null;
}

/** PDF / EML guardados del pedido, en el orden en que se adjuntaron. */
export function rutasAdjuntosConTotal(
  adjuntos: readonly OrigenAdjunto[],
): string[] {
  const rutas = adjuntos
    .filter((item) => {
      if (!item.path?.trim()) return false;
      const nombre = item.nombre.toLowerCase();
      const mime = (item.mime ?? "").toLowerCase();
      return (
        nombre.endsWith(".eml") ||
        mime.includes("message") ||
        nombre.endsWith(".pdf") ||
        mime.includes("pdf")
      );
    })
    .map((item) => item.path!.trim());
  return [...new Set(rutas)];
}

/** Lee los adjuntos uno a uno hasta encontrar el total de las OC de la OV. */
export async function leerTotalOcDesdeAdjuntos(params: {
  rutas: readonly string[];
  ocsOv: readonly (string | null | undefined)[];
  cancelado: () => boolean;
}): Promise<number | null> {
  for (const ruta of params.rutas) {
    try {
      const response = await fetch(
        `/api/ov-adjuntos/resolve-occ?path=${encodeURIComponent(ruta)}`,
      );
      if (params.cancelado()) return null;
      if (!response.ok) continue;
      const data = (await response.json()) as RespuestaTotalAdjunto;
      const total = totalSolicitudDeLaOv(data, params.ocsOv);
      if (total != null) return total;
    } catch {
      /* silencioso: el aviso solo aparece si hay total */
    }
  }
  return null;
}
