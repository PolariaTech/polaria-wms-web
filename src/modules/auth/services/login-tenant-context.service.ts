export interface TenantEmpresaOption {
  codigoEmpresa: string;
  razonSocial: string;
}

export class ResolveTenantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResolveTenantError";
  }
}

/** Resuelve empresas tenant asociadas a un correo antes del prelogin. */
export async function resolveTenantEmpresasForLogin(
  correo: string,
): Promise<TenantEmpresaOption[]> {
  const identificador = correo.trim().toLowerCase();
  if (!identificador) return [];

  let response: Response;
  try {
    response = await fetch("/login/resolve-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: identificador }),
    });
  } catch {
    throw new ResolveTenantError(
      "No se pudo contactar el servicio de resolución de empresa.",
    );
  }

  if (!response.ok) {
    throw new ResolveTenantError(
      "No se pudo resolver la empresa. Intenta de nuevo más tarde.",
    );
  }

  const data = (await response.json()) as { empresas?: TenantEmpresaOption[] };
  return data.empresas ?? [];
}
