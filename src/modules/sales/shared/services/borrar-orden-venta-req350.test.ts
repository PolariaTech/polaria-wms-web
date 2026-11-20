import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { borrarOrdenVenta } from "./sales.service";

const cancelarOrdenVentaApi = vi.hoisted(() => vi.fn());

vi.mock("./sales-api.service", () => ({
  cancelarOrdenVentaApi: (...args: unknown[]) => cancelarOrdenVentaApi(...args),
  emitirOrdenVentaApi: vi.fn(),
  listOrdenesVentaApi: vi.fn(),
  listOrdenesVentaParaSalida: vi.fn(),
}));

describe("borrarOrdenVenta REQ-350", () => {
  beforeEach(() => {
    cancelarOrdenVentaApi.mockReset();
    cancelarOrdenVentaApi.mockResolvedValue({ estado: "cancelada" });
  });

  it("en confirmada llama a cancelarOrdenVentaApi", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.maybeSingle.mockResolvedValue({
      data: { estado: "confirmada" },
      error: null,
    });
    setSupabaseClientForTests({ from: vi.fn(() => selectChain) } as never);

    await borrarOrdenVenta({
      codigoCuenta: "CUENTA-01",
      idOrdenVenta: "ov-1",
    });

    expect(cancelarOrdenVentaApi).toHaveBeenCalledWith("ov-1");
  });

  it("en alistada sigue rechazando", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.maybeSingle.mockResolvedValue({
      data: { estado: "alistada" },
      error: null,
    });
    setSupabaseClientForTests({ from: vi.fn(() => selectChain) } as never);

    await expect(
      borrarOrdenVenta({
        codigoCuenta: "CUENTA-01",
        idOrdenVenta: "ov-1",
      }),
    ).rejects.toBeInstanceOf(DomainServiceError);
    expect(cancelarOrdenVentaApi).not.toHaveBeenCalled();
  });
});
