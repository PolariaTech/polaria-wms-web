import { getApiBaseUrl } from "@/config/env";

/**
 * BFF → Nest: escribe el estado OV del surtido QR (INTERNAL_API_KEY).
 * Score-10 P0: un solo writer Nest (no UPDATE service_role).
 */
export async function avanzarEstadoSurtidoEnNest(input: {
  idOrdenVenta: string;
  estado: string;
  codigoCuenta: string;
}): Promise<void> {
  const key = process.env.INTERNAL_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "INTERNAL_API_KEY no configurada: no se puede avanzar el estado vía Nest.",
    );
  }

  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}/ventas/ordenes/${encodeURIComponent(input.idOrdenVenta)}/avanzar-estado-surtido`;
  const respuesta = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Api-Key": key,
      "X-Codigo-Cuenta": input.codigoCuenta,
    },
    body: JSON.stringify({
      estado: input.estado,
      codigoCuenta: input.codigoCuenta,
    }),
    cache: "no-store",
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text().catch(() => "");
    throw new Error(
      `Nest avanzar-estado-surtido falló (${respuesta.status}): ${texto || respuesta.statusText}`,
    );
  }
}
