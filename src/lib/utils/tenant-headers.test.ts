import { describe, expect, it } from "vitest";
import {
  applyTenantHeaders,
  setTenantHeadersGetter,
  TENANT_HEADER_NAMES,
} from "@/lib/utils/tenant-headers";

describe("tenant headers", () => {
  it("aplica headers X-Codigo-Empresa, X-Codigo-Cuenta y X-Id-Bodega", () => {
    setTenantHeadersGetter(() => ({
      codigoEmpresa: "ACME",
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    }));

    const headers = new Headers();
    applyTenantHeaders(headers);

    expect(headers.get(TENANT_HEADER_NAMES.codigoEmpresa)).toBe("ACME");
    expect(headers.get(TENANT_HEADER_NAMES.codigoCuenta)).toBe("CUENTA-01");
    expect(headers.get(TENANT_HEADER_NAMES.idBodega)).toBe("BOD-01");
  });

  it("no aplica headers si falta codigoEmpresa", () => {
    setTenantHeadersGetter(() => null);

    const headers = new Headers();
    applyTenantHeaders(headers);

    expect(headers.get(TENANT_HEADER_NAMES.codigoEmpresa)).toBeNull();
  });
});
