import { describe, expect, it } from "vitest";
import type { DocumentoOc, OcDeOv } from "./oc-documentos";
import { ocPropiaDeOv } from "./oc-propia-de-ov";

const doc = (nombre: string): DocumentoOc => ({ nombre, tipo: "pdf", url: `/api/${nombre}`, bytes: 10 });

describe("ocPropiaDeOv", () => {
  const cinco = ["182", "188", "197", "200", "207"].map((n) => doc(`OC-140${n}-AGUACATES.pdf`));

  it("con la OC de la OV deja solo el documento que la trae", () => {
    const oc: OcDeOv = { documentos: cinco, omitidos: [] };

    expect(ocPropiaDeOv(oc, "4500140188").documentos.map((d) => d.nombre)).toEqual(["OC-140188-AGUACATES.pdf"]);
  });

  it("si ningún nombre trae la OC, no cambia nada", () => {
    const oc: OcDeOv = { documentos: [doc("C.PRINCIPAL (AGUACATES).pdf"), doc("COMEDOR (AGUACATES).pdf")], omitidos: [] };

    expect(ocPropiaDeOv(oc, "390693")).toEqual(oc);
  });

  it("con la OC vacía no cambia nada", () => {
    const oc: OcDeOv = { documentos: cinco, omitidos: [] };

    expect(ocPropiaDeOv(oc, "")).toEqual(oc);
    expect(ocPropiaDeOv(oc, null)).toEqual(oc);
  });

  it("nunca toca los omitidos", () => {
    const omitidos: OcDeOv["omitidos"] = [{ nombre: "grande.pdf", motivo: "muy_grande" }];

    expect(ocPropiaDeOv({ documentos: cinco, omitidos }, "4500140188").omitidos).toEqual(omitidos);
  });
});
