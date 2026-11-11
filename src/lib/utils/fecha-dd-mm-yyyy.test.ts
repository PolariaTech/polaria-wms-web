import { describe, expect, it } from "vitest";
import { formatIsoToDdMmYyyy, formatIsoToDdMonAbrev, parseDdMmYyyyToIso } from "./fecha-dd-mm-yyyy";

describe("fecha-dd-mm-yyyy", () => {
  it("formatea ISO a DD/MM/AAAA", () => {
    expect(formatIsoToDdMmYyyy("2026-10-23")).toBe("23/10/2026");
  });

  it("formatea ISO a día y mes abreviado, sin año", () => {
    expect(formatIsoToDdMonAbrev("2026-11-03")).toBe("03-NOV");
    expect(formatIsoToDdMonAbrev("2026-01-15")).toBe("15-ENE");
    expect(formatIsoToDdMonAbrev("2026-12-31")).toBe("31-DIC");
    expect(formatIsoToDdMonAbrev("")).toBe("");
    expect(formatIsoToDdMonAbrev("2026-13-03")).toBe("");
  });

  it("parsea DD/MM/AAAA a ISO", () => {
    expect(parseDdMmYyyyToIso("23/10/2026")).toBe("2026-10-23");
    expect(parseDdMmYyyyToIso("3/9/2026")).toBe("2026-09-03");
  });

  it("acepta ISO de entrada", () => {
    expect(parseDdMmYyyyToIso("2026-10-23")).toBe("2026-10-23");
  });

  it("rechaza fechas imposibles", () => {
    expect(parseDdMmYyyyToIso("32/10/2026")).toBeNull();
    expect(parseDdMmYyyyToIso("10/23/2026")).toBeNull(); // mes 23
  });
});
