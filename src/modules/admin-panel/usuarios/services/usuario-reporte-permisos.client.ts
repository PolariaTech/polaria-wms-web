import { useAuthStore } from "@/stores/auth.store";
import type { BodegaExternaEmbedReportOption } from "./cuenta-reporte-embed.client";

export interface UsuarioReportePermisosResponse {
  idUsuario: string;
  reports: BodegaExternaEmbedReportOption[];
  grantedIds: string[];
}

const PERMISOS_PATH = "/reportes-embed/permisos";

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

async function permisosFetch<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Sesión requerida.");
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "No se pudieron actualizar los permisos de reportes.";
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

export async function getUsuarioReportePermisos(
  idUsuario: string,
): Promise<UsuarioReportePermisosResponse> {
  const query = new URLSearchParams({ idUsuario });
  return permisosFetch<UsuarioReportePermisosResponse>(
    `${PERMISOS_PATH}?${query.toString()}`,
    { method: "GET" },
  );
}

export async function saveUsuarioReportePermisos(
  idUsuario: string,
  reportIds: readonly string[],
): Promise<string[]> {
  const data = await permisosFetch<{ grantedIds: string[] }>(PERMISOS_PATH, {
    method: "PUT",
    body: JSON.stringify({ idUsuario, reportIds }),
  });
  return data.grantedIds ?? [];
}
