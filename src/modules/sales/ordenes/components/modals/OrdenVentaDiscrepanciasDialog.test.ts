import { describe, expect, it } from "vitest";
import { resolverCompradorPickerSugerencias } from "../../utils/match/resolver-comprador-picker-priority-ids";

/** Los overlays pasan compradoresParaPicker al picker de clientes (REQ-326). */
describe("OrdenVentaModalOverlays / clientes (REQ-326)", () => {
  it("arma el catálogo con sugerencias primero para el picker", () => {
    const out = resolverCompradorPickerSugerencias({
      compradores: [
        {
          idComprador: "1",
          codigo: "1",
          comprador: "Uno",
          apodo: "",
          denominacionComercialOverride: "",
          telefono: null,
          rfc: "",
          grupo: "",
          estaActivo: true,
        },
        {
          idComprador: "2",
          codigo: "2",
          comprador: "Dos SA",
          apodo: "Solicitado Mateo",
          denominacionComercialOverride: "",
          telefono: null,
          rfc: "",
          grupo: "",
          estaActivo: true,
        },
      ],
      compradorNombreIa: "Solicitado Mateo",
    });
    expect(out.compradoresParaPicker[0]?.idComprador).toBe("2");
  });
});
