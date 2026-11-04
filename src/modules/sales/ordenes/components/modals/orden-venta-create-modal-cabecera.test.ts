import { describe, expect, it } from "vitest";
import {
  descriptionCreateModalOv,
  tituloCreateModalOv,
} from "./orden-venta-create-modal-cabecera";

describe("tituloCreateModalOv", () => {
  it("en edición muestra Editar · folio", () => {
    expect(
      tituloCreateModalOv({
        isEditing: true,
        step: "form",
        folioVisible: "OV-00001075",
      }),
    ).toBe("Editar · OV-00001075");
  });
});

describe("descriptionCreateModalOv", () => {
  it("en edición del formulario no muestra instrucción de folio (REQ-220)", () => {
    expect(
      descriptionCreateModalOv({
        isEditing: true,
        step: "form",
        formDescription: "Captura manual",
        startMode: null,
      }),
    ).toBeUndefined();
  });

  it("en pickOt de edición sí pide elegir OT", () => {
    expect(
      descriptionCreateModalOv({
        isEditing: true,
        step: "pickOt",
        formDescription: "Captura manual",
        startMode: null,
      }),
    ).toBe("Elige qué orden de trabajo quieres editar");
  });

  it("en captura form usa formDescription", () => {
    expect(
      descriptionCreateModalOv({
        isEditing: false,
        step: "form",
        formDescription: "Captura manual",
        startMode: "scratch",
      }),
    ).toBe("Captura manual");
  });
});
