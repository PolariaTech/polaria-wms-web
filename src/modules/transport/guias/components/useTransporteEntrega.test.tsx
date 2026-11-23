import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTransporteEntrega } from "./useTransporteEntrega";

const getOrdenVentaDetalle = vi.fn();

vi.mock("@/modules/sales", () => ({
  getOrdenVentaDetalle: (...args: unknown[]) => getOrdenVentaDetalle(...args),
}));
vi.mock("../../shared/services/transport-api.service", () => ({
  registrarEntregaApi: vi.fn(),
  uploadEvidenciaTransporteApi: vi.fn(),
}));

const VIAJE = {
  idViaje: "v-1",
  idGuia: "g-1",
  idOrdenVenta: "ov-1",
} as never;

function setup(open = true) {
  const onClose = vi.fn();
  const onEntregado = vi.fn();
  const hook = renderHook(() =>
    useTransporteEntrega({
      open,
      viaje: VIAJE,
      codigoCuenta: "C1",
      idBodega: "B1",
      onClose,
      onEntregado,
    }),
  );
  return { ...hook, onClose, onEntregado };
}

describe("useTransporteEntrega", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrdenVentaDetalle.mockResolvedValue({
      lineas: [{ id_linea_orden_venta: "l-1", cantidad_pedida: 5 }],
    });
  });

  it("carga el detalle e inicializa cantidades", async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.detalle).not.toBeNull());
    expect(result.current.cantidades).toEqual({ 0: "5" });
    expect(result.current.lineaVerificada).toEqual({ 0: false });
    expect(result.current.paso).toBe(0);
  });

  it("expone error si falla la carga del detalle", async () => {
    getOrdenVentaDetalle.mockRejectedValue(new Error("sin detalle"));
    const { result } = setup();

    await waitFor(() => expect(result.current.detalleError).toBe("sin detalle"));
  });

  it("handleNext exige verificar productos y luego avanza", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.detalle).not.toBeNull());

    act(() => result.current.handleNext());
    expect(result.current.error).toMatch(/Verificá todos los productos/);
    expect(result.current.paso).toBe(0);

    act(() => result.current.setLineaVerificada({ 0: true }));
    act(() => result.current.handleNext());
    expect(result.current.error).toBeNull();
    expect(result.current.paso).toBe(1);

    act(() => result.current.handleBack());
    expect(result.current.paso).toBe(0);
  });

  it("paso de foto requiere archivo y valida tipo", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.detalle).not.toBeNull());
    act(() => result.current.setLineaVerificada({ 0: true }));
    act(() => result.current.handleNext());

    act(() => result.current.handleNext());
    expect(result.current.error).toBe("La foto de evidencia es obligatoria.");

    const notImage = new File(["x"], "a.txt", { type: "text/plain" });
    act(() =>
      result.current.onFotoChange({ 0: notImage, length: 1 } as never),
    );
    expect(result.current.error).toBe("Solo se permiten imágenes.");
    expect(result.current.fotoFile).toBeNull();
  });

  it("handleEntregar valida que se completaron los pasos", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.detalle).not.toBeNull());

    await act(async () => {
      await result.current.handleEntregar();
    });

    expect(result.current.error).toBe(
      "Completá todos los pasos antes de cerrar la entrega.",
    );
  });

  it("handleClose resetea y llama onClose", async () => {
    const { result, onClose } = setup();
    await waitFor(() => expect(result.current.detalle).not.toBeNull());

    act(() => result.current.handleClose());

    expect(onClose).toHaveBeenCalled();
    expect(result.current.detalle).toBeNull();
  });
});
