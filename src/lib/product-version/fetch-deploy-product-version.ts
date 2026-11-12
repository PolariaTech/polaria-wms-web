import { PRODUCT_VERSION_API_PATH } from "./product-version-constants";

export type DeployProductVersionResponse = {
  version: string;
};

/**
 * Lee la versión del deploy actual. Si falla la red o el JSON, devuelve null
 * (no se muestra alerta: evita falsos positivos).
 */
export async function fetchDeployProductVersion(
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const response = await fetchImpl(PRODUCT_VERSION_API_PATH, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as DeployProductVersionResponse;
    const version = typeof body.version === "string" ? body.version.trim() : "";
    return version || null;
  } catch {
    return null;
  }
}
