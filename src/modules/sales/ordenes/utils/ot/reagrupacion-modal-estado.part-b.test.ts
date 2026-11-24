import { describe, expect, it, vi } from "vitest";
import { armarPickerOtRespaldo, decidirAperturaReagruparAlCargar, reagruparAbiertoSegunCypher, reagruparModalAbierto } from "./reagrupacion-modal-estado";

describe("armarPickerOtRespaldo (REQ-188)", () => {
  const hijas = [
    { id: "ot-1", label: "OT 1", renglones: [{}, {}], totalCantidad: 5, almacen: "Frío" },
    { id: "ot-2", label: "OT 2", renglones: [{}], totalCantidad: 1, almacen: "Seco" },
  ];

  it("CA1: lleva el botón «Modificar con IA» cuando la página lo entrega", () => {
    const onReagrupar = vi.fn();
    const picker = armarPickerOtRespaldo({
      hijas,
      selectedId: null,
      onSelect: vi.fn(),
      onReagrupar,
    });

    expect(picker?.onReagrupar).toBe(onReagrupar);
    expect(picker?.hijas.map((hija) => hija.productosCount)).toEqual([2, 1]);
  });

  it("CA2: sin acción de la página no hay botón", () => {
    const picker = armarPickerOtRespaldo({
      hijas,
      selectedId: "ot-2",
      onSelect: vi.fn(),
    });

    expect(picker?.onReagrupar).toBeUndefined();
    expect(picker?.selectedId).toBe("ot-2");
  });

  it("CA3: sin selección toma la primera OT, y sin OT no hay selector", () => {
    expect(
      armarPickerOtRespaldo({ hijas, selectedId: null, onSelect: vi.fn() })?.selectedId,
    ).toBe("ot-1");
    expect(
      armarPickerOtRespaldo({ hijas: [], selectedId: null, onSelect: vi.fn() }),
    ).toBeNull();
  });
});

describe("decidirAperturaReagruparAlCargar (REQ-188)", () => {
  const listo = {
    pedida: true,
    formularioAbierto: true,
    editando: true,
    ordenCargada: true,
    estadoOrdenVenta: "por_confirmar",
    cantidadOt: 2,
  };

  it("CA1: con el formulario cargado y la OV por confirmar, abre el chat", () => {
    expect(decidirAperturaReagruparAlCargar(listo)).toBe("abrir");
  });

  it("CA2: espera mientras el formulario no trae el estado ni las OT", () => {
    expect(decidirAperturaReagruparAlCargar({ ...listo, estadoOrdenVenta: null })).toBe("esperar");
    expect(decidirAperturaReagruparAlCargar({ ...listo, cantidadOt: 0 })).toBe("esperar");
  });

  it("CA3: si la OV ya no está por confirmar, descarta la petición sin abrir", () => {
    expect(
      decidirAperturaReagruparAlCargar({ ...listo, estadoOrdenVenta: "confirmada" }),
    ).toBe("descartar");
  });

  it("CA4: sin petición, sin formulario abierto o sin edición no hace nada", () => {
    expect(decidirAperturaReagruparAlCargar({ ...listo, pedida: false })).toBe("ninguna");
    expect(decidirAperturaReagruparAlCargar({ ...listo, formularioAbierto: false })).toBe("ninguna");
    expect(decidirAperturaReagruparAlCargar({ ...listo, editando: false })).toBe("ninguna");
  });
});

describe("decidirAperturaReagruparAlCargar — datos de la OV anterior (REQ-188, «a veces solo abre el formulario»)", () => {
  const pedido = {
    pedida: true,
    formularioAbierto: true,
    editando: true,
    estadoOrdenVenta: "por_confirmar",
    cantidadOt: 2,
  };

  it("mientras el formulario aún trae el estado y las OT de la OV anterior, espera (no abre ni descarta)", () => {
    // Primer render al abrir otra OV: estado y OT son los de la anterior, ordenCargada = false.
    expect(decidirAperturaReagruparAlCargar({ ...pedido, ordenCargada: false })).toBe("esperar");
    // Aunque la OV anterior hubiera estado confirmada, no se descarta la petición con datos ajenos.
    expect(
      decidirAperturaReagruparAlCargar({ ...pedido, ordenCargada: false, estadoOrdenVenta: "confirmada" }),
    ).toBe("esperar");
  });

  it("una vez cargada la OV pedida decide con sus datos", () => {
    expect(decidirAperturaReagruparAlCargar({ ...pedido, ordenCargada: true })).toBe("abrir");
    expect(
      decidirAperturaReagruparAlCargar({ ...pedido, ordenCargada: true, estadoOrdenVenta: "confirmada" }),
    ).toBe("descartar");
  });

  it("sin petición no hace nada aunque no esté cargada", () => {
    expect(decidirAperturaReagruparAlCargar({ ...pedido, pedida: false, ordenCargada: false })).toBe("ninguna");
  });
});

describe("reagruparAbiertoSegunCypher (el chat se cierra con el Cypher)", () => {
  it("con el Cypher cerrado el chat queda cerrado, aunque estuviera abierto", () => {
    expect(reagruparAbiertoSegunCypher(true, false)).toBe(false);
  });

  it("con el Cypher abierto respeta el estado del chat", () => {
    expect(reagruparAbiertoSegunCypher(true, true)).toBe(true);
    expect(reagruparAbiertoSegunCypher(false, true)).toBe(false);
  });

  it("cerrar el Cypher y volver a abrirlo no hace reaparecer el chat", () => {
    let reagruparOpen = true;
    // Se cierra el Cypher con la X.
    reagruparOpen = reagruparAbiertoSegunCypher(reagruparOpen, false);
    // Se vuelve a abrir el Cypher con el «+».
    reagruparOpen = reagruparAbiertoSegunCypher(reagruparOpen, true);
    expect(reagruparOpen).toBe(false);
    expect(reagruparModalAbierto({ reagruparOpen, cypherOpen: true, isEditing: true, tieneOrdenVenta: true })).toBe(false);
  });
});
