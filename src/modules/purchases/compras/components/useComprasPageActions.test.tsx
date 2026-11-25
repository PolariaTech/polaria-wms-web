import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useComprasPageActions } from "./useComprasPageActions";

vi.mock("@/modules/admin-panel", () => ({
  listProveedoresAdmin: vi.fn(async () => []),
}));
vi.mock("../../shared/services/purchases-api.service", () => ({
  enviarSolicitudCompraAprobacionApi: vi.fn(),
  updateOrdenCompraDestinoApi: vi.fn(),
}));
vi.mock("../../shared/services/purchases.service", () => ({
  listOrdenCompraLineas: vi.fn(),
}));
vi.mock("../../ordenes/services/pedido-proveedor-client.service", () => ({
  buildPedidoProveedorRequest: vi.fn(),
  notifyProveedorPedido: vi.fn(),
}));

function buildQuery() {
  return {
    data: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    reload: vi.fn(async () => undefined),
  };
}

describe("useComprasPageActions", () => {
  let solicitudes: ReturnType<typeof buildQuery>;
  let ordenes: ReturnType<typeof buildQuery>;

  beforeEach(() => {
    solicitudes = buildQuery();
    ordenes = buildQuery();
  });

  it("runAction recarga listas al terminar", async () => {
    const { result } = renderHook(() =>
      useComprasPageActions({ codigoCuenta: "C", solicitudes, ordenes }),
    );

    await act(async () => {
      await result.current.runAction("a:1", async () => undefined);
    });

    expect(solicitudes.reload).toHaveBeenCalled();
    expect(ordenes.reload).toHaveBeenCalled();
    expect(result.current.actionError).toBeNull();
    expect(result.current.pendingActionId).toBeNull();
  });

  it("runAction expone el mensaje de DomainServiceError", async () => {
    const { result } = renderHook(() =>
      useComprasPageActions({ codigoCuenta: "C", solicitudes, ordenes }),
    );

    await act(async () => {
      await result.current.runAction("a:1", async () => {
        throw new DomainServiceError("mal", "MUTATION_FAILED");
      });
    });

    expect(result.current.actionError).toBe("mal");
  });

  it("runAction usa mensaje genérico para errores desconocidos", async () => {
    const { result } = renderHook(() =>
      useComprasPageActions({ codigoCuenta: "C", solicitudes, ordenes }),
    );

    await act(async () => {
      await result.current.runAction("a:1", async () => {
        throw new Error("x");
      });
    });

    expect(result.current.actionError).toBe("No se pudo completar la acción.");
  });

  it("startEnviarAprobacion sin cuenta ni proveedor informa error", () => {
    const { result } = renderHook(() =>
      useComprasPageActions({ codigoCuenta: null, solicitudes, ordenes }),
    );

    act(() => {
      result.current.startEnviarAprobacion({
        id_solicitud_compra: "s-1",
        id_proveedor: null,
      } as never);
    });

    expect(result.current.actionError).toBe("No se encontró la cuenta activa.");
  });
});
