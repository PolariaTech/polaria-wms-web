import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  consultarIngreso: vi.fn(),
  ingresarCorreo: vi.fn(),
}));

vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  usePolariaToast: () => ({ showToast: vi.fn() }),
}));
vi.mock("../services/correos.client", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("../services/correos.client")>()),
  ...api,
}));

import { ingreso } from "../testing/correos.fixtures";
import { useIngresoCorreo } from "./useIngresoCorreo";

const ID_A = "msg-a-123456";
const ID_B = "msg-b-123456";
const ID_C = "msg-c-123456";

describe("useIngresoCorreo (POL-416)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("pasados 5 min sigue sondeando y no fabrica «Tardó más de lo esperado»", async () => {
    api.ingresarCorreo.mockResolvedValue(ingreso({ messageId: ID_A }));
    api.consultarIngreso.mockResolvedValue(ingreso({ messageId: ID_A }));
    const { result, unmount } = renderHook(() => useIngresoCorreo());

    await act(async () => {
      await result.current.ingresar(ID_A);
    });
    await act(() => vi.advanceTimersByTimeAsync(5 * 60_000 + 6_000));

    expect(result.current.locales[ID_A]?.estado).toBe("procesando");
    expect(result.current.locales[ID_A]?.error).toBeNull();
    expect(JSON.stringify(result.current.locales)).not.toContain("Tardó más de lo esperado");
    expect(api.consultarIngreso.mock.calls.length).toBeGreaterThan(1);
    unmount();
  });

  it("un error del api (ingreso vencido) queda en locales para mostrar Reintentar", async () => {
    api.ingresarCorreo.mockResolvedValue(ingreso({ messageId: ID_A }));
    api.consultarIngreso.mockResolvedValue(
      ingreso({
        messageId: ID_A,
        estado: "error",
        error: "El ingreso no terminó. Toca Reintentar.",
      }),
    );
    const { result } = renderHook(() => useIngresoCorreo());

    await act(async () => {
      await result.current.ingresar(ID_A);
    });
    await act(() => vi.advanceTimersByTimeAsync(3_000));

    expect(result.current.locales[ID_A]).toMatchObject({
      estado: "error",
      error: "El ingreso no terminó. Toca Reintentar.",
    });
  });

  it("tres ingresos a la vez muestran cada uno su propio estado", async () => {
    api.ingresarCorreo.mockImplementation(async (messageId: string) => ingreso({ messageId }));
    api.consultarIngreso.mockImplementation(async (messageId: string) => {
      if (messageId === ID_A) {
        return ingreso({
          messageId: ID_A,
          estado: "error",
          error: "El ingreso no terminó. Toca Reintentar.",
        });
      }
      if (messageId === ID_B) {
        return ingreso({
          messageId: ID_B,
          estado: "ingresado",
          codigoOrdenVenta: "OV-1",
        });
      }
      return ingreso({ messageId: ID_C });
    });
    const { result } = renderHook(() => useIngresoCorreo());

    await act(async () => {
      await result.current.ingresar(ID_A);
      await result.current.ingresar(ID_B);
      await result.current.ingresar(ID_C);
    });
    await act(() => vi.advanceTimersByTimeAsync(3_000));

    expect(result.current.locales[ID_A]?.estado).toBe("error");
    expect(result.current.locales[ID_B]?.estado).toBe("ingresado");
    expect(result.current.locales[ID_C]?.estado).toBe("procesando");
  });
});
