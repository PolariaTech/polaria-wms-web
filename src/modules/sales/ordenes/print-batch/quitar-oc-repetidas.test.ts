import { describe, expect, it } from "vitest";
import type { DocumentoOc, OcDeOv } from "./oc-documentos";
import { NOTA_OC_EN_OTRA_OV, quitarOcRepetidas } from "./quitar-oc-repetidas";

const doc = (nombre: string): DocumentoOc => ({ nombre, tipo: "pdf", url: `/api/${nombre}`, bytes: 10 });
const oc = (...nombres: string[]): OcDeOv => ({ documentos: nombres.map(doc), omitidos: [] });

describe("quitarOcRepetidas", () => {
  it("la primera OV conserva los documentos y la segunda recibe un aviso por cada uno", () => {
    const compartidos = ["C.PRINCIPAL.pdf", "COMEDOR.pdf"];

    const { ocPorOv, avisosPorOv } = quitarOcRepetidas([
      { idOrdenVenta: "a", venta: "OV-00001798", oc: oc(...compartidos) },
      { idOrdenVenta: "b", venta: "OV-00001799", oc: oc(...compartidos) },
    ]);

    expect(ocPorOv.get("a")!.documentos).toHaveLength(2);
    expect(ocPorOv.get("b")!.documentos).toHaveLength(0);
    expect(avisosPorOv.get("a") ?? []).toEqual([]);
    expect(avisosPorOv.get("b")).toEqual([
      `C.PRINCIPAL.pdf: ${NOTA_OC_EN_OTRA_OV} OV-00001798.`,
      `COMEDOR.pdf: ${NOTA_OC_EN_OTRA_OV} OV-00001798.`,
    ]);
    expect(avisosPorOv.get("b")![0]).toBe("C.PRINCIPAL.pdf: ya va impresa con OV-00001798.");
  });

  it("cinco OV ya filtradas conservan su documento y no reciben avisos", () => {
    const items = ["182", "188", "197", "200", "207"].map((n, i) => ({
      idOrdenVenta: `v${i}`,
      venta: `OV-${i}`,
      oc: oc(`OC-140${n}.pdf`),
    }));

    const { ocPorOv, avisosPorOv } = quitarOcRepetidas(items);

    for (const item of items) expect(ocPorOv.get(item.idOrdenVenta)!.documentos).toHaveLength(1);
    expect([...avisosPorOv.values()].flat()).toEqual([]);
  });

  it("una OV sola queda igual", () => {
    const entrada = oc("a.pdf", "b.pdf");

    const { ocPorOv } = quitarOcRepetidas([{ idOrdenVenta: "a", venta: "OV-1", oc: entrada }]);

    expect(ocPorOv.get("a")).toEqual(entrada);
  });

  it("respeta el orden de entrada: el documento sale con la primera OV que lo trae", () => {
    const { ocPorOv, avisosPorOv } = quitarOcRepetidas([
      { idOrdenVenta: "z", venta: "OV-Z", oc: oc("x.pdf") },
      { idOrdenVenta: "a", venta: "OV-A", oc: oc("x.pdf") },
    ]);

    expect(ocPorOv.get("z")!.documentos).toHaveLength(1);
    expect(avisosPorOv.get("a")).toEqual(["x.pdf: ya va impresa con OV-Z."]);
  });
});
