import { describe, expect, it } from "vitest";
import {
  isConfirmSubmitDisabled,
  resolveConfirmBloqueoReason,
  shouldCloseModalAfterSubmit,
} from "./confirm-bloqueo-ov";

describe("confirm-bloqueo-ov (REQ-195)", () => {
  const base = {
    step: "form",
    isLoading: false,
    isSaving: false,
    hasProductos: true,
    lineasCount: 2,
    idComprador: "c1",
    hasCatalogPending: false,
    esPorConfirmar: true,
    revisionMessage: null as string | null,
  };

  it("explica catalogPending y falta de cliente", () => {
    expect(
      resolveConfirmBloqueoReason({
        ...base,
        hasCatalogPending: true,
        revisionMessage: "Producto sin validar (manzana)",
      }),
    ).toBe("Producto sin validar (manzana)");
    expect(
      resolveConfirmBloqueoReason({ ...base, idComprador: "" }),
    ).toBe("Falta cliente");
  });

  it("deshabilita Confirmar con pendientes", () => {
    expect(isConfirmSubmitDisabled({ ...base, hasCatalogPending: true })).toBe(
      true,
    );
    expect(isConfirmSubmitDisabled({ ...base, idComprador: "" })).toBe(true);
    expect(isConfirmSubmitDisabled(base)).toBe(false);
  });
});

describe("shouldCloseModalAfterSubmit (REQ-182)", () => {
  it("avance no cierra; confirmar sí", () => {
    expect(shouldCloseModalAfterSubmit(true)).toBe(false);
    expect(shouldCloseModalAfterSubmit(false)).toBe(true);
  });
});
