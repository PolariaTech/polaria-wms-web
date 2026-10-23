import { describe, expect, it } from "vitest";
import { formatIsoToDdMmYyyy, parseDdMmYyyyToIso } from "./fecha-dd-mm-yyyy";

describe("fecha-dd-mm-yyyy", () => {
  it("formatea ISO a DD/MM/AAAA", () => {
    expect(formatIsoToDdMmYyyy("2026-10-23")).toBe("23/10/2026");
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
