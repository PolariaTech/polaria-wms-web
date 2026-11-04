import { describe, expect, it } from "vitest";
import type { PolariaFormModalProps } from "./polaria-form-modal-props";

describe("polaria-form-modal-props", () => {
  it("expone footerBeforeCancel en el contrato", () => {
    const muestra: Pick<PolariaFormModalProps, "footerBeforeCancel" | "title"> =
      {
        title: "Pedido",
        footerBeforeCancel: null,
      };
    expect(muestra.title).toBe("Pedido");
  });
});
