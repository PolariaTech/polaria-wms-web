import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOvsDelMismoCorreo } from "./use-ovs-del-mismo-correo";

const buscar = vi.fn();

vi.mock("../../../shared/services/ovs-del-mismo-correo", () => ({
  buscarOvsDelMismoCorreo: (entrada: unknown) => buscar(entrada),
}));

const hermanas = [
  { idOrdenVenta: "a", codigo: "OV-1", ordenCompra: "111111" },
  { idOrdenVenta: "b", codigo: "OV-2", ordenCompra: "222222" },
];

describe("useOvsDelMismoCorreo (REQ-313)", () => {
  beforeEach(() => {
    buscar.mockReset();
  });

  it("carga las hermanas y pasa la cuenta y el origen al servicio", async () => {
    buscar.mockResolvedValue(hermanas);

    const { result } = renderHook(() =>
      useOvsDelMismoCorreo({ codigoCuenta: "1YW43", idOrdenVenta: "a", origenArchivos: "[]" }),
    );

    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.hermanas).toEqual(hermanas);
    expect(buscar).toHaveBeenCalledWith({ codigoCuenta: "1YW43", origenArchivos: "[]" });
  });

  it("si la consulta falla deja la lista vacía y no lanza", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    buscar.mockRejectedValue(new Error("falló"));

    const { result } = renderHook(() =>
      useOvsDelMismoCorreo({ codigoCuenta: "c", idOrdenVenta: "a", origenArchivos: "[]" }),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.hermanas).toEqual([]);
  });

  it("ignora la respuesta vieja si cambia la OV", async () => {
    let resolverPrimera: (valor: unknown) => void = () => undefined;
    buscar.mockImplementationOnce(() => new Promise((resolver) => (resolverPrimera = resolver)));
    buscar.mockResolvedValueOnce([]);

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useOvsDelMismoCorreo({ codigoCuenta: "c", idOrdenVenta: id, origenArchivos: "[]" }),
      { initialProps: { id: "a" } },
    );
    rerender({ id: "b" });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    resolverPrimera(hermanas);

    await new Promise((listo) => setTimeout(listo, 0));
    expect(result.current.hermanas).toEqual([]);
  });
});
