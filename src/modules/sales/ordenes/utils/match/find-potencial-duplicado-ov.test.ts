import { describe, expect, it } from "vitest";
import {
  annotatePotencialDuplicadoOv,
  findDuplicadosAgainstDraft,
} from "./find-potencial-duplicado-ov";

describe("annotatePotencialDuplicadoOv (REQ-151)", () => {
  it("marca dos OV con la misma OCC", () => {
    const map = annotatePotencialDuplicadoOv([
      {
        idOrdenVenta: "a",
        codigo: "OV-1",
        occTodas: ["4501056534"],
        comprador: "Hotel A",
        fecha: "2026-10-20T10:00:00Z",
        estado: "por_confirmar",
      },
      {
        idOrdenVenta: "b",
        codigo: "OV-2",
        occTodas: ["4501056534"],
        comprador: "Hotel A",
        fecha: "2026-10-21T10:00:00Z",
        estado: "por_confirmar",
      },
      {
        idOrdenVenta: "c",
        codigo: "OV-3",
        occTodas: ["999"],
        comprador: "Otro",
        fecha: "2026-10-20T10:00:00Z",
        estado: "confirmada",
      },
    ]);
    expect(map.get("a")?.potencialDuplicado).toBe(true);
    expect(map.get("a")?.potencialDuplicadoDe).toEqual(["OV-2"]);
    expect(map.get("b")?.potencialDuplicadoDe).toEqual(["OV-1"]);
    expect(map.get("c")?.potencialDuplicado).toBe(false);
  });

  it("marca por_confirmar sin OCC con mismo cliente y día", () => {
    const map = annotatePotencialDuplicadoOv([
      {
        idOrdenVenta: "a",
        codigo: "OV-1",
        occTodas: [],
        comprador: "Fairmont Mayakoba",
        fecha: "2026-10-20T08:00:00Z",
        estado: "por_confirmar",
      },
      {
        idOrdenVenta: "b",
        codigo: "OV-2",
        occTodas: [],
        comprador: "FAIRMONT MAYAKOBA",
        fecha: "2026-10-20T18:00:00Z",
        estado: "por_confirmar",
      },
    ]);
    expect(map.get("a")?.potencialDuplicado).toBe(true);
    expect(map.get("b")?.potencialDuplicadoDe).toContain("OV-1");
  });
});

describe("findDuplicadosAgainstDraft", () => {
  it("encuentra por OCC del borrador", () => {
    const hits = findDuplicadosAgainstDraft({
      draft: {
        occTokens: ["4501056534"],
        comprador: "X",
        fecha: "2026-10-20",
        idOrdenVentaExcluir: "self",
      },
      existentes: [
        {
          idOrdenVenta: "self",
          codigo: "OV-SELF",
          occTodas: ["4501056534"],
          comprador: "X",
          fecha: "2026-10-20",
          estado: "por_confirmar",
        },
        {
          idOrdenVenta: "other",
          codigo: "OV-OTHER",
          occTodas: ["4501056534"],
          comprador: "Y",
          fecha: "2026-10-01",
          estado: "confirmada",
        },
      ],
    });
    expect(hits.map((h) => h.codigo)).toEqual(["OV-OTHER"]);
  });

  it("encuentra por cliente+día si no hay OCC y la otra está por_confirmar", () => {
    const hits = findDuplicadosAgainstDraft({
      draft: {
        occTokens: [],
        comprador: "Fairmont Mayakoba",
        fecha: "2026-10-20T15:00:00Z",
        idOrdenVentaExcluir: null,
      },
      existentes: [
        {
          idOrdenVenta: "a",
          codigo: "OV-1",
          occTodas: [],
          comprador: "FAIRMONT MAYAKOBA",
          fecha: "2026-10-20T08:00:00Z",
          estado: "por_confirmar",
        },
        {
          idOrdenVenta: "b",
          codigo: "OV-2",
          occTodas: [],
          comprador: "FAIRMONT MAYAKOBA",
          fecha: "2026-10-20T09:00:00Z",
          estado: "confirmada",
        },
      ],
    });
    expect(hits.map((h) => h.codigo)).toEqual(["OV-1"]);
  });
});
