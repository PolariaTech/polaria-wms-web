import { describe, expect, it } from "vitest";
import { resolverCompradorPickerSugerencias } from "../utils/match/resolver-comprador-picker-priority-ids";

/**
 * useCatalogoPickerOv (sembrar-lineas-desde-origen) delega a
 * resolverCompradorPickerSugerencias — mismo patrón que productos (REQ-326).
 */
describe("useCatalogoPickerOv (REQ-326)", () => {
  it("deja las sugerencias de Mateo primero en el catálogo del picker", () => {
    const { priorityIds, compradoresParaPicker } =
      resolverCompradorPickerSugerencias({
        compradores: [
          {
            idComprador: "c-b",
            codigo: "B",
            comprador: "Cliente B",
            apodo: "",
            denominacionComercialOverride: "",
            telefono: null,
            rfc: "",
            grupo: "",
            estaActivo: true,
          },
          {
            idComprador: "c-a",
            codigo: "A",
            comprador: "Cliente A SA",
            apodo: "Marca Solicitada",
            denominacionComercialOverride: "",
            telefono: null,
            rfc: "",
            grupo: "",
            estaActivo: true,
          },
        ],
        compradorNombreIa: "Marca Solicitada",
        idComprador: "",
      });
    expect(priorityIds).toEqual(["c-a"]);
    expect(compradoresParaPicker[0]?.idComprador).toBe("c-a");
  });
});
