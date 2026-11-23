import type {
  OrdenVentaFotoCapturaItem,
  OrdenVentaOtConFotosItem,
} from "../modals/OrdenVentaFotosCapturaModal";

export const MENSAJE_ERROR_FOTOS = "No se pudieron cargar las fotos.";

type CuerpoFotosApi = {
  error?: string;
  ordenesTrabajo?: OrdenVentaOtConFotosItem[];
  fotos?: Array<{
    idFoto?: string;
    idOrdenTrabajo?: string;
    urlFoto?: string | null;
    createdAt?: string | null;
  }>;
};

/** Texto de un error al cargar fotos: el del `Error`, o el genérico. */
export function mensajeErrorFotos(error: unknown): string {
  return error instanceof Error ? error.message : MENSAJE_ERROR_FOTOS;
}

/**
 * Pide el historial de captura de una OV. Con `idOrdenTrabajo` trae solo las fotos de esa OT
 * (sin URL vacía); sin ella, la lista de OT con fotos. Lanza si la respuesta no es OK.
 */
export async function fetchFotosCaptura(
  idOrdenVenta: string,
  idOrdenTrabajo?: string,
): Promise<{
  ordenesTrabajo: OrdenVentaOtConFotosItem[];
  fotos: OrdenVentaFotoCapturaItem[];
}> {
  const params = new URLSearchParams({ historial: "1" });
  if (idOrdenTrabajo) params.set("ot", idOrdenTrabajo);
  const response = await fetch(
    `/captura-orden/${encodeURIComponent(idOrdenVenta)}/api?${params.toString()}`,
  );
  const body = (await response.json()) as CuerpoFotosApi;
  if (!response.ok) {
    throw new Error(body.error || MENSAJE_ERROR_FOTOS);
  }
  const fotos = (body.fotos ?? [])
    .map((item) => ({
      idFoto: item.idFoto,
      idOrdenTrabajo: item.idOrdenTrabajo,
      urlFoto: item.urlFoto?.trim() ?? "",
      createdAt: item.createdAt ?? null,
    }))
    .filter((item) => Boolean(item.urlFoto));
  return { ordenesTrabajo: body.ordenesTrabajo ?? [], fotos };
}
