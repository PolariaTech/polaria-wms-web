export interface TenantRequestHeaders {
  codigoEmpresa: string;
  codigoCuenta?: string;
  idBodega?: string;
}

let tenantHeadersGetter: (() => TenantRequestHeaders | null) | null = null;

export function setTenantHeadersGetter(
  getter: () => TenantRequestHeaders | null,
): void {
  tenantHeadersGetter = getter;
}

export function getTenantHeaders(): TenantRequestHeaders | null {
  return tenantHeadersGetter?.() ?? null;
}

export const TENANT_HEADER_NAMES = {
  codigoEmpresa: "X-Codigo-Empresa",
  codigoCuenta: "X-Codigo-Cuenta",
  idBodega: "X-Id-Bodega",
} as const;

export function applyTenantHeaders(headers: Headers): void {
  const tenant = getTenantHeaders();
  if (!tenant?.codigoEmpresa) return;

  headers.set(TENANT_HEADER_NAMES.codigoEmpresa, tenant.codigoEmpresa);

  if (tenant.codigoCuenta) {
    headers.set(TENANT_HEADER_NAMES.codigoCuenta, tenant.codigoCuenta);
  }

  if (tenant.idBodega) {
    headers.set(TENANT_HEADER_NAMES.idBodega, tenant.idBodega);
  }
}
