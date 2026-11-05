import { describe, expect, it, vi } from "vitest";
import { createEmptyOrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import { aplicarDetalleSinMateo } from "./aplicar-detalle-sin-mateo";

describe("aplicarDetalleSinMateo (REQ-236)", () => {
  it("fusiona líneas BD con renglones origen pendientes cuando está materializada", () => {
    const hija = createEmptyOrdenTrabajoHija({ id: "ot-1", almacen: "Cocina" });
    hija.renglones = [
      { Producto: "Aguacate", Cantidad: 1, _idProducto: "prod-1" },
      { Producto: "Tomate", Cantidad: 1, _idProducto: "prod-2" },
    ];
    const setLineas = vi.fn();
    aplicarDetalleSinMateo({
      ovMaterializada: true,
      lineasDesdeDetalle: () => [
        {
          idProducto: "prod-1",
          nombre: "Aguacate",
          codigo: "100",
          idBodega: "b1",
          cantidadInput: "1",
          cajasInput: "",
          presentacion: "",
          especificacion: "",
          descuentoPctInput: "",
          ivaPct: "0",
          kgDisponible: 1,
          unidadMedida: "KGM",
          precioUnitario: 1,
          precioInput: "1",
          otId: "ot-1",
          catalogPending: false,
          catalogAmbiguo: false,
          sugerencia: null,
          sugerenciasAlternativas: [],
        },
      ],
      hijasEdit: [hija],
      idCompradorDetalle: "c1",
      nombreEscritoOrigen: null,
      compradorRows: [],
      skipOtSeedFromOrigenRef: { current: false },
      setLineas,
      setStartMode: vi.fn(),
      setFormOtPage: vi.fn(),
      setStep: vi.fn(),
      setCompradorNombreIa: vi.fn(),
      setCompradorLabel: vi.fn(),
      setCompradorSugerencias: vi.fn(),
      setMissingFields: vi.fn(),
      origenCorreoRows: hija.renglones,
      productoRows: [
        {
          idProducto: "prod-1",
          codigo: "100",
          nombre: "Aguacate",
          idBodega: "b1",
          kgDisponible: 1,
          unidadMedida: "KGM",
          precioUnitario: 1,
        },
        {
          idProducto: "prod-2",
          codigo: "200",
          nombre: "Tomate",
          idBodega: "b1",
          kgDisponible: 1,
          unidadMedida: "KGM",
          precioUnitario: 1,
        },
      ],
    });
    expect(setLineas).toHaveBeenCalled();
    const lineas = setLineas.mock.calls[0][0];
    expect(lineas).toHaveLength(2);
    expect(lineas[1]?.idProducto).toBe("prod-2");
    expect(lineas[1]?.catalogPending).toBe(false);
  });
});
