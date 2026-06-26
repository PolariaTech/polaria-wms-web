export interface TenantEmpresaOption {
  codigoEmpresa: string;
  razonSocial: string;
}

/** Resuelve empresas tenant asociadas a un correo antes del prelogin. */
export async function resolveTenantEmpresasForLogin(
  correo: string,
): Promise<TenantEmpresaOption[]> {
  const identificador = correo.trim().toLowerCase();
  if (!identificador) return [];

  try {
    const response = await fetch("/login/resolve-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: identificador }),
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { empresas?: TenantEmpresaOption[] };
    return data.empresas ?? [];
  } catch {
    return [];
  }
}
