import { describe, expect, it } from "vitest";
import type { CamionListRow } from "../services/camiones.service";
import {
  buildCamionEditFormValues,
  parseOptionalNumberInput,
  resolveCamionTipo,
} from "./camion-modal.helpers";

describe("parseOptionalNumberInput", () => {
  it("devuelve null para vacío o solo espacios", () => {
    expect(parseOptionalNumberInput("")).toBeNull();
    expect(parseOptionalNumberInput("   ")).toBeNull();
  });

  it("acepta coma decimal", () => {
    expect(parseOptionalNumberInput("12,5")).toBe(12.5);
  });

  it("devuelve null para texto no numérico", () => {
    expect(parseOptionalNumberInput("abc")).toBeNull();
  });
});

describe("resolveCamionTipo / buildCamionEditFormValues", () => {
  it("usa refrigerado como tipo por defecto", () => {
    expect(resolveCamionTipo("no-existe")).toBe("refrigerado");
  });

  it("construye los valores del formulario de edición", () => {
    const values = buildCamionEditFormValues({
      idCamion: 1,
      codigo: "C-1",
      placa: "ABC123",
      marca: null,
      modelo: null,
      capacidadKg: 1500,
      capacidadM3: null,
      capacidadPallets: null,
      tipo: "refrigerado",
      rangoTemperatura: null,
      disponible: true,
      estaActivo: true,
      createdAt: "2026-01-01",
    } as unknown as CamionListRow);

    expect(values.placa).toBe("ABC123");
    expect(values.marca).toBe("");
    expect(values.capacidadKg).toBe("1500");
    expect(values.capacidadM3).toBe("");
    expect(values.tipo).toBe("refrigerado");
    expect(values.disponible).toBe(true);
  });
});
