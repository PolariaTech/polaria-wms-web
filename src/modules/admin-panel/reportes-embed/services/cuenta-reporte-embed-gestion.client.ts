import { useAuthStore } from "@/stores/auth.store";

export interface CuentaReporteEmbedAdminRow {
  id: string;
  descripcion: string | null;
  reporteId: string;
  embedUrl: string;
  estaActivo: boolean;
}

const GESTION_PATH = "/reportes-embed/gestion";

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

async function gestionFetch<T>(init: RequestInit): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Sesión requerida.");
  }

  const response = await fetch(GESTION_PATH, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "No se pudieron gestionar los reportes.";
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

export async function listCuentaReportesEmbedAdmin(): Promise<
  CuentaReporteEmbedAdminRow[]
> {
  const data = await gestionFetch<{ reports?: CuentaReporteEmbedAdminRow[] }>({
    method: "GET",
  });
  return data.reports ?? [];
}

export async function createCuentaReporteEmbedAdmin(input: {
  descripcion: string;
  embedUrl: string;
}): Promise<CuentaReporteEmbedAdminRow> {
  const data = await gestionFetch<{ report: CuentaReporteEmbedAdminRow }>({
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.report;
}

export async function updateCuentaReporteEmbedAdmin(input: {
  id: string;
  descripcion: string;
  embedUrl: string;
  estaActivo: boolean;
}): Promise<CuentaReporteEmbedAdminRow> {
  const data = await gestionFetch<{ report: CuentaReporteEmbedAdminRow }>({
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.report;
}
