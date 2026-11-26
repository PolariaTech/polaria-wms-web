import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import { useCatalogoPickerOv } from "./sembrar-lineas-desde-origen-catalogo-picker";
import { publicarPreciosSeparados } from "./precios-comprador-separados";

function lineaSinPrecio(): LineaVentaForm {
  return {
    idProducto: "epa",
    nombre: "EPAZOTE",
    codigo: "10501545",
    idBodega: "b1",
    cantidadInput: "0.3",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    ivaPct: "0",
    kgDisponible: 1,
    unidadMedida: "KGM",
    precioUnitario: 0,
    precioInput: "",
    precioManual: false,
    catalogPending: false,
    catalogAmbiguo: false,
    sugerencia: null,
    sugerenciasAlternativas: [],
  };
}

describe("useCatalogoPickerOv precio faltante", () => {
  afterEach(() => {
    publicarPreciosSeparados({ ultimos: {}, equivalencia: {} });
  });

  it("escribe el precio de la equivalencia en la línea que llegó en cero", async () => {
    publicarPreciosSeparados({ ultimos: {}, equivalencia: { epa: 16 } });
    const setLineas = vi.fn();
    renderHook(() =>
      useCatalogoPickerOv({
        replaceLineaIndex: null,
        productosParaAgregar: [],
        lineas: [lineaSinPrecio()],
        idComprador: "c1",
        compradorSugerencias: [],
        compradores: [],
        compradorNombreIa: "",
        compradorLabel: "",
        origenCorreoDraft: [],
        setLineas,
        precioOverrideByProducto: { epa: 16 },
        productosBase: [
          {
            idProducto: "epa",
            precioUnitario: 0,
            label: "EPAZOTE",
            idCliente: null,
            idBodega: "b1",
            codigo: "10501545",
            nombre: "EPAZOTE",
            kgDisponible: 1,
            unidadMedida: "KGM",
          },
        ],
      } as unknown as OrdenVentaFormEstado),
    );
    await waitFor(() => {
      expect(setLineas).toHaveBeenCalled();
    });
    const actualizar = setLineas.mock.calls[0]?.[0] as (
      prev: LineaVentaForm[],
    ) => LineaVentaForm[];
    const next = actualizar([lineaSinPrecio()]);
    expect(next[0]?.precioUnitario).toBe(16);
    expect(next[0]?.precioManual).toBe(false);
  });

  it("escribe los 16 del catálogo aunque la equivalencia separada esté vacía", async () => {
    const setLineas = vi.fn();
    renderHook(() =>
      useCatalogoPickerOv({
        replaceLineaIndex: null,
        productosParaAgregar: [],
        lineas: [lineaSinPrecio()],
        idComprador: "c1",
        compradorSugerencias: [],
        compradores: [],
        compradorNombreIa: "",
        compradorLabel: "",
        origenCorreoDraft: [],
        setLineas,
        precioOverrideByProducto: { epa: 16 },
        productosBase: [
          {
            idProducto: "epa",
            precioUnitario: 0,
            label: "EPAZOTE",
            idCliente: null,
            idBodega: "b1",
            codigo: "10501545",
            nombre: "EPAZOTE",
            kgDisponible: 1,
            unidadMedida: "KGM",
          },
        ],
      } as unknown as OrdenVentaFormEstado),
    );
    await waitFor(() => {
      expect(setLineas).toHaveBeenCalled();
    });
    const actualizar = setLineas.mock.calls.at(-1)?.[0] as (
      prev: LineaVentaForm[],
    ) => LineaVentaForm[];
    const next = actualizar([lineaSinPrecio()]);
    expect(next[0]?.precioUnitario).toBe(16);
  });
});
