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

  it("REQ-404: OC de la OV mal nombrada en el archivo: va el PDF que no es de la hermana", () => {
    // OV-00002635 (OC 4503002534) tiene un PDF …535 que por dentro dice 534; el …532 es de OV-00002636.
    const oc: OcDeOv = {
      documentos: [doc("AGUACATES DE PUEBLA_4503002535_AVA.pdf"), doc("AGUACATES DE PUEBLA_4503002532_AVA.pdf")],
      omitidos: [],
    };

    expect(ocPropiaDeOv(oc, "4503002534", ["4503002532"]).documentos.map((d) => d.nombre)).toEqual([
      "AGUACATES DE PUEBLA_4503002535_AVA.pdf",
    ]);
    expect(ocPropiaDeOv(oc, "4503002532", ["4503002534"]).documentos.map((d) => d.nombre)).toEqual([
      "AGUACATES DE PUEBLA_4503002532_AVA.pdf",
    ]);
  });

  it("nunca toca los omitidos", () => {
    const omitidos: OcDeOv["omitidos"] = [{ nombre: "grande.pdf", motivo: "muy_grande" }];

    expect(ocPropiaDeOv({ documentos: cinco, omitidos }, "4500140188").omitidos).toEqual(omitidos);
  });
});
