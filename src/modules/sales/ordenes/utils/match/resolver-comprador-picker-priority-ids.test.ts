import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import {
  nombreClienteParaSugerirPicker,
  resolverCompradorPickerSugerencias,
} from "./resolver-comprador-picker-priority-ids";

function row(
  parcial: Partial<CompradorListRow> &
    Pick<CompradorListRow, "idComprador" | "comprador">,
): CompradorListRow {
  return {
    codigo: parcial.codigo ?? parcial.idComprador,
    apodo: parcial.apodo ?? "",
    denominacionComercialOverride: parcial.denominacionComercialOverride ?? "",
    telefono: null,
    rfc: "",
    grupo: "",
    estaActivo: true,
    ...parcial,
  };
}

describe("resolverCompradorPickerSugerencias (REQ-326)", () => {
  const catalogo = [
    row({
      idComprador: "c-otro",
      codigo: "O1",
      comprador: "Otro Cliente Local",
    }),
    row({
      idComprador: "c-fair",
      codigo: "F1",
      comprador: "OPERADORA HOTELERA SA",
      apodo: "FAIRMONT MAYAKOBA",
    }),
    row({
      idComprador: "c-hilton",
      codigo: "H1",
      comprador: "HILTON CANCUN",
    }),
  ];

  it("pone las sugerencias de Mateo primero en la lista (como productos)", () => {
    const { priorityIds, compradoresParaPicker } =
      resolverCompradorPickerSugerencias({
        compradores: catalogo,
        compradorNombreIa: "Fairmont Mayakoba",
      });
    expect(priorityIds).toEqual(["c-fair"]);
    expect(compradoresParaPicker[0]?.idComprador).toBe("c-fair");
    expect(compradoresParaPicker.map((r) => r.idComprador)).toContain("c-otro");
  });

  it("usa Nombre cliente del origen si no hay compradorNombreIa", () => {
    const { priorityIds, compradoresParaPicker } =
      resolverCompradorPickerSugerencias({
        compradores: catalogo,
        compradorNombreIa: null,
        nombreEnOrigen: "Hilton Cancun",
        idComprador: "",
      });
    expect(priorityIds[0]).toBe("c-hilton");
    expect(compradoresParaPicker[0]?.idComprador).toBe("c-hilton");
  });

  it("resuelve el nombre a sugerir con prioridad Mateo > origen > label", () => {
    expect(
      nombreClienteParaSugerirPicker({
        compradorNombreIa: "A",
        nombreEnOrigen: "B",
        compradorLabel: "C",
        idComprador: "",
      }),
    ).toBe("A");
    expect(
      nombreClienteParaSugerirPicker({
        compradorNombreIa: null,
        nombreEnOrigen: "B",
        compradorLabel: "C",
        idComprador: "",
      }),
    ).toBe("B");
  });

  it("con id_comprador ya asignado sigue rankeando por Nombre cliente (cualquier cuenta)", () => {
    const { priorityIds, compradoresParaPicker } =
      resolverCompradorPickerSugerencias({
        compradores: catalogo,
        idComprador: "c-otro",
        compradorNombreIa: null,
        nombreEnOrigen: "Fairmont Mayakoba",
      });
    expect(priorityIds[0]).toBe("c-fair");
    expect(compradoresParaPicker[0]?.idComprador).toBe("c-fair");
  });
});
