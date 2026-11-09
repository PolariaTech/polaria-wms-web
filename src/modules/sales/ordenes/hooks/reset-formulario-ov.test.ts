import { describe, expect, it } from "vitest";
import {
  useAperturaDesdeDocsOv,
  useForzarFormularioAlEditar,
  useResetFormularioOv,
} from "./reset-formulario-ov";

describe("reset-formulario-ov", () => {
  it("exporta los hooks del formulario", () => {
    expect(typeof useResetFormularioOv).toBe("function");
    expect(typeof useAperturaDesdeDocsOv).toBe("function");
    expect(typeof useForzarFormularioAlEditar).toBe("function");
  });
});
