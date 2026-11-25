import { describe, expect, it, vi } from "vitest";
import {
  armarPickerOtRespaldo,
  decidirAperturaReagruparAlCargar,
  puedeModificarConIaDesdeLista,
  reagruparAbiertoSegunCypher,
  reagruparModalAbierto,
} from "./reagrupacion-modal-estado-cypher";

describe("reagrupacion-modal-estado-cypher", () => {
  it("reagruparModalAbierto exige todos los flags activos", () => {
    expect(
      reagruparModalAbierto({
        reagruparOpen: true,
        cypherOpen: true,
        isEditing: true,
        tieneOrdenVenta: true,
      }),
    ).toBe(true);

    expect(
      reagruparModalAbierto({
        reagruparOpen: true,
        cypherOpen: false,
        isEditing: true,
        tieneOrdenVenta: true,
      }),
    ).toBe(false);
  });

  it("puedeModificarConIaDesdeLista solo habilita con Cypher solo y OV por_confirmar", () => {
    expect(
      puedeModificarConIaDesdeLista({
        inspect: false,
        cypherId: "ov-1",
        formularioAbierto: false,
        detalleAbierto: false,
        estadoOrdenVenta: "por_confirmar",
      }),
    ).toBe(true);

    expect(
      puedeModificarConIaDesdeLista({
        inspect: false,
        cypherId: "ov-1",
        formularioAbierto: true,
        detalleAbierto: false,
        estadoOrdenVenta: "por_confirmar",
      }),
    ).toBe(false);

    expect(
      puedeModificarConIaDesdeLista({
        inspect: false,
        cypherId: "ov-1",
        formularioAbierto: false,
        detalleAbierto: false,
        estadoOrdenVenta: "confirmada",
      }),
    ).toBe(false);
  });

  it("armarPickerOtRespaldo devuelve null sin OT y mapea conteo/selección con OT", () => {
    const onSelect = vi.fn();
    expect(
      armarPickerOtRespaldo({ hijas: [], selectedId: null, onSelect }),
    ).toBeNull();

    const picker = armarPickerOtRespaldo({
      hijas: [
        {
          id: "ot-1",
          label: "OT 1",
          renglones: [{}, {}],
          totalCantidad: 5,
          almacen: "COCINA",
        },
      ],
      selectedId: null,
      onSelect,
    });

    expect(picker?.selectedId).toBe("ot-1");
    expect(picker?.hijas[0]).toEqual({
      id: "ot-1",
      label: "OT 1",
      productosCount: 2,
      totalCantidad: 5,
      almacen: "COCINA",
    });
  });

  it("decidirAperturaReagruparAlCargar cubre ninguna, esperar, abrir y descartar", () => {
    expect(
      decidirAperturaReagruparAlCargar({
        pedida: false,
        formularioAbierto: true,
        editando: true,
        ordenCargada: true,
        estadoOrdenVenta: "por_confirmar",
        cantidadOt: 1,
      }),
    ).toBe("ninguna");

    expect(
      decidirAperturaReagruparAlCargar({
        pedida: true,
        formularioAbierto: true,
        editando: true,
        ordenCargada: false,
        estadoOrdenVenta: "por_confirmar",
        cantidadOt: 1,
      }),
    ).toBe("esperar");

    expect(
      decidirAperturaReagruparAlCargar({
        pedida: true,
        formularioAbierto: true,
        editando: true,
        ordenCargada: true,
        estadoOrdenVenta: "por_confirmar",
        cantidadOt: 2,
      }),
    ).toBe("abrir");

    expect(
      decidirAperturaReagruparAlCargar({
        pedida: true,
        formularioAbierto: true,
        editando: true,
        ordenCargada: true,
        estadoOrdenVenta: "confirmada",
        cantidadOt: 2,
      }),
    ).toBe("descartar");
  });

  it("reagruparAbiertoSegunCypher solo mantiene abierto si Cypher sigue abierto", () => {
    expect(reagruparAbiertoSegunCypher(true, true)).toBe(true);
    expect(reagruparAbiertoSegunCypher(true, false)).toBe(false);
    expect(reagruparAbiertoSegunCypher(false, true)).toBe(false);
  });
});
