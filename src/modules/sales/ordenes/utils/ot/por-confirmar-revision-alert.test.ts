import { describe, expect, it } from "vitest";
import {
  findPrimeraRevisionPendiente,
  revisionFocusSelector,
} from "./por-confirmar-revision-alert";

const base = {
  idComprador: "c1",
  exigeOc: false,
  ordenCompraHotel: "",
  fechaEntrega: "2026-10-23",
  todayIso: "2026-10-22",
  ventanaDesde: "06:00",
  ventanaHasta: "10:00",
  hijas: [
    { id: "ot-1", label: "Cocina", almacen: "Cocina" },
    { id: "ot-2", label: "Bar", almacen: "Bar" },
  ],
  lineas: [
    {
      otId: "ot-1",
      idProducto: "p1",
      cantidadInput: "1",
      precioInput: "10",
    },
    {
      otId: "ot-2",
      idProducto: "p2",
      cantidadInput: "2",
      precioInput: "20",
    },
  ],
};

describe("findPrimeraRevisionPendiente", () => {
  it("null si todo está completo", () => {
    expect(findPrimeraRevisionPendiente(base)).toBeNull();
  });

  it("prioriza cabecera (cliente)", () => {
    const r = findPrimeraRevisionPendiente({ ...base, idComprador: "" });
    expect(r?.message).toBe("Falta cliente");
    expect(r?.otIndex).toBeNull();
    expect(r?.focusKind).toBe("cliente");
  });

  it("detecta producto sin validar en OT (sin centro de consumo)", () => {
    const r = findPrimeraRevisionPendiente({
      ...base,
      lineas: [
        base.lineas[0]!,
        {
          otId: "ot-2",
          idProducto: "",
          catalogPending: true,
          aliasCliente: "Aguacate",
          cantidadInput: "1",
          precioInput: "10",
        },
      ],
    });
    expect(r?.otIndex).toBe(1);
    expect(r?.lineaIndex).toBe(1);
    expect(r?.focusKind).toBe("producto");
    expect(r?.message).toBe("Producto sin validar (Aguacate) · OT 2");
    expect(r?.message).not.toContain("Bar");
    expect(revisionFocusSelector(r!)).toBe('[data-ov-revision="producto-1"]');
  });

  it("detecta falta de cantidad en OT", () => {
    const r = findPrimeraRevisionPendiente({
      ...base,
      lineas: [
        {
          otId: "ot-1",
          idProducto: "p1",
          cantidadInput: "",
          precioInput: "10",
        },
        base.lineas[1]!,
      ],
    });
    expect(r?.otIndex).toBe(0);
    expect(r?.message).toBe("Falta cantidad · OT 1");
    expect(r?.focusKind).toBe("cantidad");
    expect(revisionFocusSelector(r!)).toBe('[data-ov-revision="cantidad-0"]');
  });
});
