import { describe, expect, it } from "vitest";
import { mapDenominacionDetalleFields } from "./map-denominacion-detalle";
import { ordenVentaCaptureFields } from "./orden-venta-capture-fields";

describe("mapDenominacionDetalleFields + capture (contrato REQ-241)", () => {
  it("Front capture y Back detalle coinciden en el override", () => {
    const override = "Luis Hotel";
    const capture = ordenVentaCaptureFields({
      codigoCuenta: "mit",
      denominacionComercialOverride: override,
    });
    const detalle = mapDenominacionDetalleFields({
      compradorApodo: "Apodo Sync",
      compradorOverride: override,
      ordenOverride: override,
    });
    expect(capture.denominacion_comercial_override).toBe(override);
    expect(detalle.denominacion_comercial_override).toBe(override);
    expect(detalle.comprador_denominacion_comercial_override).toBe(override);
  });

  it("override vacío en capture es null y en detalle cae a null", () => {
    const capture = ordenVentaCaptureFields({
      codigoCuenta: "mit",
      denominacionComercialOverride: "  ",
    });
    const detalle = mapDenominacionDetalleFields({
      compradorApodo: "Apodo",
      compradorOverride: null,
      ordenOverride: null,
    });
    expect(capture.denominacion_comercial_override).toBeNull();
    expect(detalle.denominacion_comercial_override).toBeNull();
    expect(detalle.comprador_apodo).toBe("Apodo");
  });
});
