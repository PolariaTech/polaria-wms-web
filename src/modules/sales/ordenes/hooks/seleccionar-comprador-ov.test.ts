import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCompradorAdmin,
  listCompradorProductoAliasAdmin,
  type CompradorListRow,
} from "@/modules/admin-panel";
import {
  fetchUltimaDireccionEntregaPorComprador,
  fetchUltimosPreciosPorComprador,
} from "../../shared/services/sales.service";
import { seleccionarCompradorOv } from "./seleccionar-comprador-ov";

vi.mock("@/modules/admin-panel", () => ({
  getCompradorAdmin: vi.fn(),
  listCompradorProductoAliasAdmin: vi.fn(),
}));

vi.mock("../../shared/services/sales.service", () => ({
  fetchUltimaDireccionEntregaPorComprador: vi.fn(),
  fetchUltimosPreciosPorComprador: vi.fn(),
}));

const hotel: CompradorListRow = {
  idComprador: "c2",
  codigo: "HS",
  comprador: "Hotel Sur",
  apodo: "",
  denominacionComercialOverride: "",
  telefono: "555",
  rfc: "",
  grupo: "",
  estaActivo: true,
};

function acciones() {
  return {
    setIdComprador: vi.fn(),
    setCompradorLabel: vi.fn(),
    setExigeOc: vi.fn(),
    setCompradorNombreIa: vi.fn(),
    setCompradorSugerencias: vi.fn(),
    setError: vi.fn(),
    setMissingFields: vi.fn(),
    setAvisoVerificarDireccion: vi.fn(),
    setWarnFields: vi.fn(),
    setTelefono: vi.fn(),
    applyCompradorPrefill: vi.fn(),
    setPrecioOverrideByProducto: vi.fn(),
    setEquivalenciaByProducto: vi.fn(),
    setDenominacionComercial: vi.fn(),
  };
}

describe("seleccionarCompradorOv", () => {
  beforeEach(() => {
    vi.mocked(getCompradorAdmin).mockReset();
    vi.mocked(listCompradorProductoAliasAdmin).mockReset();
    vi.mocked(fetchUltimosPreciosPorComprador).mockReset();
    vi.mocked(fetchUltimaDireccionEntregaPorComprador).mockReset();
    // REQ-252: por defecto no hay una última dirección confirmada.
    vi.mocked(fetchUltimaDireccionEntregaPorComprador).mockResolvedValue(null);
  });

  it("sin cuenta deja el cliente elegido y no pide la ficha", () => {
    const ui = acciones();
    const selectedCompradorIdRef = { current: "" };
    seleccionarCompradorOv({
      row: hotel,
      codigoCuenta: null,
      selectedCompradorIdRef,
      ...ui,
    });
    expect(selectedCompradorIdRef.current).toBe("c2");
    expect(ui.setCompradorLabel).toHaveBeenCalledWith("Hotel Sur");
    expect(ui.setDenominacionComercial).toHaveBeenCalledWith("");
    expect(ui.setExigeOc).toHaveBeenCalledWith(false);
    expect(ui.setCompradorNombreIa).toHaveBeenCalledWith(null);
    expect(getCompradorAdmin).not.toHaveBeenCalled();
    const updater = ui.setMissingFields.mock.calls[0][0] as (prev: Set<string>) => Set<string>;
    expect(updater(new Set(["cliente"])).has("cliente")).toBe(false);
  });

  it("cambiar de un cliente a otro pide revisar la dirección", () => {
    const ui = acciones();
    seleccionarCompradorOv({
      row: hotel,
      options: { verificarDireccionEntrega: true, keepNombreIa: true },
      codigoCuenta: null,
      selectedCompradorIdRef: { current: "c1" },
      ...ui,
    });
    expect(ui.setAvisoVerificarDireccion).toHaveBeenCalledWith(true);
    expect(ui.setCompradorNombreIa).not.toHaveBeenCalled();
    const updater = ui.setWarnFields.mock.calls[0][0] as (prev: Set<string>) => Set<string>;
    expect(updater(new Set()).has("direccion")).toBe(true);
    const telefono = ui.setTelefono.mock.calls[0][0] as (prev: string) => string;
    expect(telefono("")).toBe("555");
    expect(telefono("999")).toBe("999");
  });

  it("con cuenta carga la ficha y el precio del alias", async () => {
    vi.mocked(getCompradorAdmin).mockResolvedValue({
      ficha: { centros: [], contactos: [] },
    } as never);
    vi.mocked(listCompradorProductoAliasAdmin).mockResolvedValue([
      { idProducto: "p1", precioOverride: 12, alias: "Palta" },
    ] as never);
    vi.mocked(fetchUltimosPreciosPorComprador).mockResolvedValue({});
    const ui = acciones();
    seleccionarCompradorOv({
      row: hotel,
      codigoCuenta: "demo",
      selectedCompradorIdRef: { current: "" },
      ...ui,
    });
    await vi.waitFor(() =>
      expect(ui.applyCompradorPrefill).toHaveBeenCalledWith(
        hotel,
        { centros: [], contactos: [] },
        { onlyEmpty: true, ultimaDireccionConfirmada: null },
      ),
    );
    expect(ui.setPrecioOverrideByProducto).toHaveBeenCalledWith({ p1: 12 });
    expect(ui.setEquivalenciaByProducto).toHaveBeenCalledWith({ p1: "Palta" });
  });

  it("REQ-252: pasa al prefill la última dirección confirmada de ese cliente", async () => {
    vi.mocked(getCompradorAdmin).mockResolvedValue({ ficha: { centros: [], contactos: [] } } as never);
    vi.mocked(listCompradorProductoAliasAdmin).mockResolvedValue([] as never);
    vi.mocked(fetchUltimosPreciosPorComprador).mockResolvedValue({});
    vi.mocked(fetchUltimaDireccionEntregaPorComprador).mockResolvedValue("Blvd. Kukulcán km 9");
    const ui = acciones();
    seleccionarCompradorOv({
      row: hotel,
      codigoCuenta: "demo",
      selectedCompradorIdRef: { current: "" },
      ...ui,
    });
    await vi.waitFor(() =>
      expect(ui.applyCompradorPrefill).toHaveBeenCalledWith(
        hotel,
        { centros: [], contactos: [] },
        { onlyEmpty: true, ultimaDireccionConfirmada: "Blvd. Kukulcán km 9" },
      ),
    );
    expect(fetchUltimaDireccionEntregaPorComprador).toHaveBeenCalledWith({
      codigoCuenta: "demo",
      idComprador: "c2",
    });
  });

  it("REQ-252: si no se puede traer la última dirección, igual aplica la ficha y no avisa error", async () => {
    vi.mocked(getCompradorAdmin).mockResolvedValue({ ficha: { centros: [], contactos: [] } } as never);
    vi.mocked(listCompradorProductoAliasAdmin).mockResolvedValue([] as never);
    vi.mocked(fetchUltimosPreciosPorComprador).mockResolvedValue({});
    vi.mocked(fetchUltimaDireccionEntregaPorComprador).mockRejectedValue(new Error("sin red"));
    const ui = acciones();
    seleccionarCompradorOv({
      row: hotel,
      codigoCuenta: "demo",
      selectedCompradorIdRef: { current: "" },
      ...ui,
    });
    await vi.waitFor(() =>
      expect(ui.applyCompradorPrefill).toHaveBeenCalledWith(
        hotel,
        { centros: [], contactos: [] },
        { onlyEmpty: true, ultimaDireccionConfirmada: null },
      ),
    );
    expect(ui.setError).not.toHaveBeenCalledWith(
      "Se seleccionó el cliente, pero no se pudieron cargar sus datos de alta.",
    );
  });

  it("si la ficha falla avisa y no deshace la selección", async () => {
    vi.mocked(getCompradorAdmin).mockRejectedValue(new Error("caído"));
    vi.mocked(listCompradorProductoAliasAdmin).mockResolvedValue([] as never);
    vi.mocked(fetchUltimosPreciosPorComprador).mockResolvedValue({});
    const ui = acciones();
    seleccionarCompradorOv({
      row: hotel,
      codigoCuenta: "demo",
      selectedCompradorIdRef: { current: "c2" },
      ...ui,
    });
    await vi.waitFor(() =>
      expect(ui.setError).toHaveBeenCalledWith(
        "Se seleccionó el cliente, pero no se pudieron cargar sus datos de alta.",
      ),
    );
    expect(ui.setIdComprador).toHaveBeenCalledWith("c2");
  });
});
