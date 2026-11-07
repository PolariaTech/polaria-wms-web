import { getApiBaseUrl } from "@/config/env";
import { applyTenantHeaders } from "@/lib/utils/tenant-headers";
import { useAuthStore } from "@/stores/auth.store";
import {
  errorDeRespuesta,
  ReagrupacionApiError,
  type CriterioDivision,
} from "./reagrupar-ot.client";

/**
 * Cliente del endpoint `POST /ventas/ordenes/:id/ordenes-trabajo/dividir` (REQ-262 / REQ-273).
 *
 * Crea una orden de venta por cada valor que sale (orden de compra, día u horario de
 * entrega) y deja en la actual lo demás.
 * El servidor parte lo que está GUARDADO, no lo que hay en pantalla. Las ediciones sin
 * guardar en las tareas que salen no pasan a la orden nueva: el panel del plan avisa
 * al operador de que las guarde antes de confirmar.
 */

export interface OrdenVentaNuevaApi {
  idOrdenVenta: string;
  codigo: string;
  /** Valor del criterio que quedó en esa orden. */
  valor: string;
}

export interface ResultadoDivisionOv {
  ordenesNuevas: OrdenVentaNuevaApi[];
  /** Valores que se quedaron juntos en la orden actual. */
  valoresQuedan: string[];
}

function esOrdenNueva(valor: unknown): valor is OrdenVentaNuevaApi {
  if (typeof valor !== "object" || valor === null) return false;
  const orden = valor as Record<string, unknown>;
  return (
    typeof orden.idOrdenVenta === "string" &&
    typeof orden.codigo === "string" &&
    typeof orden.valor === "string"
  );
}

export async function dividirOrdenVenta(params: {
  idOrdenVenta: string;
  criterio: CriterioDivision;
  valoresSalen: string[];
  signal?: AbortSignal;
}): Promise<ResultadoDivisionOv> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  applyTenantHeaders(headers);

  let response: Response;
  try {
    response = await fetch(
      `${getApiBaseUrl()}/ventas/ordenes/${encodeURIComponent(
        params.idOrdenVenta,
      )}/ordenes-trabajo/dividir`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        signal: params.signal,
        body: JSON.stringify({
          criterio: params.criterio,
          valoresSalen: params.valoresSalen,
        }),
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ReagrupacionApiError(
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      "RED",
    );
  }

  const cuerpo = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw errorDeRespuesta(response.status, cuerpo);

  const { ordenesNuevas, valoresQuedan } = cuerpo;
  if (
    !Array.isArray(ordenesNuevas) ||
    !ordenesNuevas.every(esOrdenNueva) ||
    !Array.isArray(valoresQuedan) ||
    !valoresQuedan.every((valor) => typeof valor === "string")
  ) {
    throw new ReagrupacionApiError(
      "La respuesta del servidor no tiene el formato esperado.",
      "RESPUESTA_INESPERADA",
      response.status,
    );
  }
  return { ordenesNuevas, valoresQuedan };
}
