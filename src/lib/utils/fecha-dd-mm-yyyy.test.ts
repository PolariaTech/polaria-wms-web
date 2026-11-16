import { describe, expect, it } from "vitest";
import {
  formatIsoToDdMmYyyy,
  formatIsoToDdMonAbrev,
  formatIsoToDdMonYyyy,
  parseDdMmYyyyToIso,
} from "./fecha-dd-mm-yyyy";

describe("fecha-dd-mm-yyyy (REQ-320)", () => {
  it("formatea ISO a DD-MMM-AAAA", () => {
    expect(formatIsoToDdMonYyyy("2026-10-23")).toBe("23-OCT-2026");
    expect(formatIsoToDdMmYyyy("2026-10-23")).toBe("23-OCT-2026");
    expect(formatIsoToDdMonAbrev("2026-11-03")).toBe("03-NOV-2026");
    expect(formatIsoToDdMonAbrev("2026-01-15")).toBe("15-ENE-2026");
    expect(formatIsoToDdMonAbrev("")).toBe("");
    expect(formatIsoToDdMonAbrev("2026-13-03")).toBe("");
  });

  it("parsea DD-MMM-AAAA a ISO", () => {
    expect(parseDdMmYyyyToIso("23-OCT-2026")).toBe("2026-10-23");
    expect(parseDdMmYyyyToIso("3-sep-2026")).toBe("2026-09-03");
    expect(parseDdMmYyyyToIso("12-NOV-2026")).toBe("2026-11-12");
    expect(parseDdMmYyyyToIso("17-NOV-2026 (MARTES)")).toBe("2026-11-17");
  });

  it("sigue parseando DD/MM/AAAA e ISO", () => {
    expect(parseDdMmYyyyToIso("23/10/2026")).toBe("2026-10-23");
    expect(parseDdMmYyyyToIso("3/9/2026")).toBe("2026-09-03");
    expect(parseDdMmYyyyToIso("2026-10-23")).toBe("2026-10-23");
  });

  it("rechaza fechas imposibles", () => {
    expect(parseDdMmYyyyToIso("32/10/2026")).toBeNull();
    expect(parseDdMmYyyyToIso("10/23/2026")).toBeNull();
    expect(parseDdMmYyyyToIso("32-OCT-2026")).toBeNull();
    expect(parseDdMmYyyyToIso("12-XYZ-2026")).toBeNull();
  });
});
