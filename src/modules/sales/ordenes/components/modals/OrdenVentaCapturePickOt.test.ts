import { describe, expect, it } from "vitest";
import { resolverCompradorPickerSugerencias } from "../../utils/match/resolver-comprador-picker-priority-ids";

/** OrdenVentaModalPickers pasa compradoresParaPicker al modal (REQ-326). */
describe("OrdenVentaModalPickers / clientes (REQ-326)", () => {
  it("el catálogo del picker empieza por la sugerencia de Mateo", () => {
    const { compradoresParaPicker, priorityIds } =
      resolverCompradorPickerSugerencias({
        compradores: [
          {
            idComprador: "z",
            codigo: "Z",
            comprador: "Zeta SA",
            apodo: "",
            denominacionComercialOverride: "",
            telefono: null,
            rfc: "",
            grupo: "",
            estaActivo: true,
          },
          {
            idComprador: "m",
            codigo: "M",
            comprador: "Razon Larga",
            apodo: "Pedido Mateo",
            denominacionComercialOverride: "",
            telefono: null,
            rfc: "",
            grupo: "",
            estaActivo: true,
          },
        ],
        compradorNombreIa: "Pedido Mateo",
      });
    expect(priorityIds[0]).toBe("m");
    expect(compradoresParaPicker[0]?.idComprador).toBe("m");
  });
});
