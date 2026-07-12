import { getPersistedAccessToken } from "@/lib/auth/auth-sync";
import { applyTenantHeaders } from "@/lib/utils/tenant-headers";

function buildAuthHeaders(): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });

  const token = getPersistedAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  applyTenantHeaders(headers);
  return headers;
}

/** Registra demoras en alerta_operativa vía API interna (service role en servidor). */
export async function syncDemoraAlertasHistorial(params: {
  codigoCuenta: string;
  idBodega: string;
}): Promise<{ persisted: number; alertasTotal: number }> {
  const headers = buildAuthHeaders();

  const response = await fetch("/api/operaciones/sync-demora-alertas", {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    persisted?: number;
    alertasTotal?: number;
  };

  return {
    persisted: payload.persisted ?? 0,
    alertasTotal: payload.alertasTotal ?? 0,
  };
}

export async function countAlertasOperativasHistorial(params: {
  codigoCuenta: string;
  idBodega: string;
}): Promise<number> {
  const result = await syncDemoraAlertasHistorial(params);
  return result.alertasTotal;
}
