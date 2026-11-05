import { describe, expect, it } from "vitest";
import {
  resolveOccCampoFormulario,
  revisionPendienteVisible,
} from "./occ-alineada-listado-ov";

describe("resolveOccCampoFormulario (REQ-170)", () => {
  it("usa la OCC guardada en hotel cuando es válida", () => {
    expect(
      resolveOccCampoFormulario({
        ordenCompraHotelGuardada: "000000000028590",
        propuestaMateo: "otra",
        origenCorreo: [],
      }),
    ).toBe("000000000028590");
  });

  it("si hotel está vacío, toma la OCC del origen_correo (misma fuente que la tabla)", () => {
    expect(
      resolveOccCampoFormulario({
        ordenCompraHotelGuardada: "",
        propuestaMateo: "",
        origenCorreo: [
          {
            "Numero pedido": "000000000028590",
            Almacen: "SLS PLAYA MUJERES",
          },
        ],
      }),
    ).toBe("000000000028590");
  });

  it("ignora basura OCR en hotel y cae al listado/origen", () => {
    expect(
      resolveOccCampoFormulario({
        ordenCompraHotelGuardada: "rAutorizado",
        propuestaMateo: "",
        origenCorreo: [
          { "Numero pedido": "4502987212", Almacen: "Cocina" },
        ],
      }),
    ).toBe("4502987212");
  });
});

describe("revisionPendienteVisible (REQ-170)", () => {
  it("oculta alertas mientras hidrata", () => {
    expect(
      revisionPendienteVisible({
        formDataReady: false,
        isLoading: true,
        isReadingIa: true,
      }),
    ).toBe(false);
  });

  it("muestra alertas solo con hidratación completa", () => {
    expect(
      revisionPendienteVisible({
        formDataReady: true,
        isLoading: false,
        isReadingIa: false,
      }),
    ).toBe(true);
  });
});
