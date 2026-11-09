import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ getApiBaseUrl: () => "/api" }));
vi.mock("@/lib/utils/tenant-headers", () => ({ applyTenantHeaders: vi.fn() }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ accessToken: "t" }) },
}));

import { FILTROS_CORREOS_VACIOS } from "../types/correos.types";
import { listarCorreos } from "./correos.client";

const pedirFila = async (extra: Record<string, unknown>) => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        total: 1,
        pagina: 1,
        tamano: 50,
        filas: [{ messageId: "m1", ...extra }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  const { filas } = await listarCorreos({
    modo: "todos",
    pagina: 1,
    tamano: 50,
    filtros: FILTROS_CORREOS_VACIOS,
  });
  return filas[0];
};

describe("correos.client — resultado del flujo (REQ-275)", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("lee resultado, confianza, tipo y la OV de cada fila", async () => {
    const leida = await pedirFila({
      resultado: "ingresado",
      confianza: "alta",
      tipo: "pedido",
      codigoOrdenVenta: "OV-00001132",
    });
    expect(leida).toMatchObject({
      resultado: "ingresado",
      confianza: "alta",
      tipo: "pedido",
      codigoOrdenVenta: "OV-00001132",
    });
  });

  it("un valor desconocido o de otro tipo llega como null", async () => {
    const leida = await pedirFila({
      resultado: "algo_nuevo",
      confianza: 3,
      tipo: 7,
      codigoOrdenVenta: { x: 1 },
    });
    expect(leida).toMatchObject({
      resultado: null,
      confianza: null,
      tipo: null,
      codigoOrdenVenta: null,
    });
  });

  it("si el api aún no manda las columnas, quedan en null", async () => {
    const leida = await pedirFila({});
    expect(leida).toMatchObject({
      resultado: null,
      confianza: null,
      tipo: null,
      codigoOrdenVenta: null,
    });
  });
});
