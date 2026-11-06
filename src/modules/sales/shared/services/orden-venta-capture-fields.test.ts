import { describe, expect, it } from "vitest";
import { ordenVentaCaptureFields } from "./orden-venta-capture-fields";

describe("ordenVentaCaptureFields", () => {
  it("normaliza strings vacíos a null", () => {
    const fields = ordenVentaCaptureFields({
      codigoCuenta: "C1",
      direccionEntrega: "  Calle 1  ",
      observaciones: "",
    });
    expect(fields.direccion_entrega).toBe("Calle 1");
    expect(fields.origen_correo).toBeNull();
  });
});

  it("REQ-241: persiste denominacion_comercial_override", () => {
    const fields = ordenVentaCaptureFields({
      codigoCuenta: "mit",
      denominacionComercialOverride: "Luis",
    });
    expect(fields.denominacion_comercial_override).toBe("Luis");
  });

  it("REQ-241: override vacío se guarda null", () => {
    const fields = ordenVentaCaptureFields({
      codigoCuenta: "mit",
      denominacionComercialOverride: "  ",
    });
    expect(fields.denominacion_comercial_override).toBeNull();
  });
