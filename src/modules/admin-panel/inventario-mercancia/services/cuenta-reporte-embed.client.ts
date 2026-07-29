import { useAuthStore } from "@/stores/auth.store";

export interface BodegaExternaEmbedReportOption {
  id: string;
  descripcion: string | null;
  reporteId: string | null;
}

export interface BodegaExternaEmbedEligibleResponse {
  eligible: boolean;
  codigoCuenta?: string;
  reports?: BodegaExternaEmbedReportOption[];
}

export interface BodegaExternaEmbedMintResponse {
  viewUrl: string;
  expiresAt: string;
  ttlSeconds: number;
}

const EMBED_BASE = "/reportes-embed";

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

async function embedFetch<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Sesión requerida.");
  }

  const response = await fetch(`${EMBED_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "No se pudo resolver el reporte embebido.";
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

/** Indica si la cuenta activa tiene dashboard embebido configurado. */
export async function getBodegaExternaEmbedEligible(): Promise<boolean> {
  try {
    const data = await embedFetch<BodegaExternaEmbedEligibleResponse>("", {
      method: "GET",
    });
    return Boolean(data.eligible);
  } catch {
    return false;
  }
}

/** Lista reportes activos de la cuenta (elegibles para embeber). */
export async function listBodegaExternaEmbedReports(): Promise<
  BodegaExternaEmbedReportOption[]
> {
  const data = await embedFetch<BodegaExternaEmbedEligibleResponse>("", {
    method: "GET",
  });
  return data.reports ?? [];
}

/** Emite URL enmascarada con token de 12 h para el iframe. */
export async function mintBodegaExternaEmbedViewUrl(
  idCuentaReporteEmbed: string,
): Promise<string> {
  const data = await embedFetch<BodegaExternaEmbedMintResponse>("", {
    method: "POST",
    body: JSON.stringify({ idCuentaReporteEmbed }),
  });
  return data.viewUrl;
}
