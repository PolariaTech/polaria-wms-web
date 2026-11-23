import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  EMPTY_ADICIONAL,
  useCustodioOrdenIngresoForm,
} from "./useCustodioOrdenIngresoForm";

const listCatalogoProductosAdmin = vi.fn();
const cerrarRecepcionCompraApi = vi.fn();

vi.mock("@/modules/admin-panel", () => ({
  listCatalogoProductosAdmin: (...args: unknown[]) =>
    listCatalogoProductosAdmin(...args),
}));
vi.mock("@/modules/purchases/shared/services/purchases-api.service", () => ({
  cerrarRecepcionCompraApi: (...args: unknown[]) =>
    cerrarRecepcionCompraApi(...args),
}));
vi.mock("@/modules/purchases/shared/services/purchases.service", () => ({
  listOrdenCompraLineasRecepcion: vi.fn(async () => []),
}));

const ORDEN = {
  id_orden_compra: "oc-1",
  codigo_cuenta: "C1",
  id_bodega: "B1",
  lineas: [
    {
      id_linea_orden_compra: "l-1",
      id_producto: "p-1",
      cantidad: 10,
      cantidad_recibida: 0,
      producto: { sku: "S1", descripcion: "Pollo", metadatos_catalogo: null },
    },
  ],
} as never;

function setup(resolveUbicacionIngreso: () => string | null) {
  const onRegistered = vi.fn();
  const hook = renderHook(() =>
    useCustodioOrdenIngresoForm({
      orden: ORDEN,
      codigoCuenta: "C1",
      resolveUbicacionIngreso,
      slotsIngresoCount: 0,
      onRegistered,
    }),
  );
  return { ...hook, onRegistered };
}

describe("useCustodioOrdenIngresoForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listCatalogoProductosAdmin.mockResolvedValue([
      { idProducto: "p-2", codigo: "C2", titulo: "Res" },
    ]);
  });

  it("carga líneas y catálogo", async () => {
    const { result } = setup(() => "U1");

    await waitFor(() => expect(result.current.lineas).toHaveLength(1));
    await waitFor(() => expect(result.current.catalogo).toHaveLength(1));
    expect(result.current.productoAdicional).toEqual(EMPTY_ADICIONAL);
    expect(result.current.isLoadingLineas).toBe(false);
  });

  it("updateLinea modifica la línea indicada", async () => {
    const { result } = setup(() => "U1");
    await waitFor(() => expect(result.current.lineas).toHaveLength(1));

    act(() =>
      result.current.updateLinea("l-1", { temperaturaInput: "-18" }),
    );
    expect(result.current.lineas[0]?.temperaturaInput).toBe("-18");
  });

  it("falla si no hay ubicación de ingreso", async () => {
    const { result } = setup(() => null);
    await waitFor(() => expect(result.current.lineas).toHaveLength(1));
    act(() =>
      result.current.updateLinea("l-1", {
        cantidadRecibidaInput: "5",
        temperaturaInput: "-18",
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe(
      "Esta bodega no tiene slots de ingreso configurados.",
    );
    expect(cerrarRecepcionCompraApi).not.toHaveBeenCalled();
  });

  it("registra el ingreso y notifica", async () => {
    cerrarRecepcionCompraApi.mockResolvedValue({});
    const { result, onRegistered } = setup(() => "U1");
    await waitFor(() => expect(result.current.lineas).toHaveLength(1));
    act(() =>
      result.current.updateLinea("l-1", {
        cantidadRecibidaInput: "5",
        temperaturaInput: "-18",
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(cerrarRecepcionCompraApi).toHaveBeenCalledWith(
      expect.objectContaining({
        idOrdenCompra: "oc-1",
        idUbicacionIngreso: "U1",
      }),
    );
    expect(onRegistered).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("muestra el mensaje de DomainServiceError", async () => {
    cerrarRecepcionCompraApi.mockRejectedValue(
      new DomainServiceError("rechazado", "MUTATION_FAILED"),
    );
    const { result } = setup(() => "U1");
    await waitFor(() => expect(result.current.lineas).toHaveLength(1));
    act(() =>
      result.current.updateLinea("l-1", {
        cantidadRecibidaInput: "5",
        temperaturaInput: "-18",
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("rechazado");
    expect(result.current.isSubmitting).toBe(false);
  });
});
