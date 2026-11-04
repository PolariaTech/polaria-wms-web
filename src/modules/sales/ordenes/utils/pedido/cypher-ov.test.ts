import { describe, expect, it } from "vitest";
import { ovTieneIdParaCypher, puedeMostrarBotonCypher } from "./cypher-ov";

describe("ovTieneIdParaCypher (REQ-199)", () => {
  it("una OV abierta para editar tiene id", () => {
    expect(ovTieneIdParaCypher({ isEditing: true, pendingEmitId: null })).toBe(true);
  });

  it("un borrador creado en esta sesión (pendingEmitId) también tiene id", () => {
    expect(ovTieneIdParaCypher({ isEditing: false, pendingEmitId: "ov-1" })).toBe(true);
  });

  it("una alta nueva sin borrador aún no tiene id", () => {
    expect(ovTieneIdParaCypher({ isEditing: false, pendingEmitId: null })).toBe(false);
    expect(ovTieneIdParaCypher({ isEditing: false, pendingEmitId: "" })).toBe(false);
  });
});

describe("puedeMostrarBotonCypher (REQ-199)", () => {
  const sinId = { isEditing: false, pendingEmitId: null };

  it("con id de OV se muestra en cualquier paso", () => {
    expect(
      puedeMostrarBotonCypher({ isEditing: true, pendingEmitId: null, startMode: null, step: "start" }),
    ).toBe(true);
    expect(
      puedeMostrarBotonCypher({ ...sinId, pendingEmitId: "ov-1", startMode: "scratch", step: "form" }),
    ).toBe(true);
  });

  it("tras leer documentos se muestra desde el preview o el formulario, aunque aún no haya id", () => {
    expect(puedeMostrarBotonCypher({ ...sinId, startMode: "docs", step: "preview" })).toBe(true);
    expect(puedeMostrarBotonCypher({ ...sinId, startMode: "docs", step: "form" })).toBe(true);
  });

  it("en la pantalla inicial no se muestra, ni con documentos elegidos", () => {
    expect(puedeMostrarBotonCypher({ ...sinId, startMode: "docs", step: "start" })).toBe(false);
  });

  it("una captura desde cero sin id no lo muestra", () => {
    expect(puedeMostrarBotonCypher({ ...sinId, startMode: "scratch", step: "form" })).toBe(false);
  });
});
