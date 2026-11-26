import { getApiBaseUrl } from "@/config/env";
import { applyTenantHeaders } from "@/lib/utils/tenant-headers";
import { useAuthStore } from "@/stores/auth.store";

export interface ResultadoMoverAdjuntoOv {
  idOrdenVentaOrigen: string;
  idOrdenVentaDestino: string;
  path: string;
}

/**
 * REQ-361: cliente de `POST /ventas/ordenes/:id/adjuntos/mover`.
 * Quita un adjunto de la OV de origen y lo mueve a otra OV hermana del mismo correo.
 */
export async function moverAdjuntoOrdenVenta(params: {
  idOrdenVenta: string;
  idOrdenVentaDestino: string;
  path: string;
  signal?: AbortSignal;
}): Promise<ResultadoMoverAdjuntoOv> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  applyTenantHeaders(headers);

  let response: Response;
  try {
    response = await fetch(
      `${getApiBaseUrl()}/ventas/ordenes/${encodeURIComponent(params.idOrdenVenta)}/adjuntos/mover`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        signal: params.signal,
        body: JSON.stringify({
          idOrdenVentaDestino: params.idOrdenVentaDestino,
          path: params.path,
        }),
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  }

  const cuerpo = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const mensaje =
      typeof cuerpo.message === "string" && cuerpo.message.trim()
        ? cuerpo.message
        : "No se pudo mover el adjunto a la otra OV.";
    throw new Error(mensaje);
  }

  return {
    idOrdenVentaOrigen: String(cuerpo.idOrdenVentaOrigen ?? params.idOrdenVenta),
    idOrdenVentaDestino: String(cuerpo.idOrdenVentaDestino ?? params.idOrdenVentaDestino),
    path: String(cuerpo.path ?? params.path),
  };
}
