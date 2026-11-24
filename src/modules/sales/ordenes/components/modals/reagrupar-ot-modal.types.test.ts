import { describe, expectTypeOf, it } from "vitest";
import type { OrdenVentaReagruparOtModalProps as DesdeModal } from "./OrdenVentaReagruparOtModal";
import type {
  OrdenVentaReagruparOtModalProps,
  SolicitudReagrupacion,
} from "./reagrupar-ot-modal.types";

describe("reagrupar-ot-modal.types", () => {
  it("el modal reexporta las mismas props que define el archivo de tipos", () => {
    expectTypeOf<DesdeModal>().toEqualTypeOf<OrdenVentaReagruparOtModalProps>();
  });

  it("la solicitud lleva el estado base y la firma del formulario", () => {
    expectTypeOf<SolicitudReagrupacion>().toHaveProperty("estadoBase");
    expectTypeOf<SolicitudReagrupacion["firma"]>().toBeString();
  });

  it("onDividir, onAplicarCorreccion y los inyectables son opcionales", () => {
    expectTypeOf<OrdenVentaReagruparOtModalProps["onDividir"]>().toBeNullable();
    expectTypeOf<
      OrdenVentaReagruparOtModalProps["onAplicarCorreccion"]
    >().toBeNullable();
    expectTypeOf<
      OrdenVentaReagruparOtModalProps["generarRequestId"]
    >().toBeNullable();
  });
});
