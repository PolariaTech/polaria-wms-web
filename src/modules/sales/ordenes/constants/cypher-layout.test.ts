import { describe, expect, it } from "vitest";
import {
  cycleCypherWidthMode,
  cypherDockReserveClass,
  cypherDockRightClass,
  cypherPanelWidthClass,
} from "./cypher-layout";

describe("cypher-layout (REQ-150)", () => {
  it("cycles compact ↔ normal ↔ wide without wrapping", () => {
    expect(cycleCypherWidthMode("compact", -1)).toBe("compact");
    expect(cycleCypherWidthMode("compact", 1)).toBe("normal");
    expect(cycleCypherWidthMode("normal", 1)).toBe("wide");
    expect(cycleCypherWidthMode("wide", 1)).toBe("wide");
    expect(cycleCypherWidthMode("wide", -1)).toBe("normal");
  });

  it("emits distinct literal rem classes per mode (Tailwind-scannable)", () => {
    const compact = cypherPanelWidthClass("compact");
    const normal = cypherPanelWidthClass("normal");
    const wide = cypherPanelWidthClass("wide");
    expect(compact).not.toBe(normal);
    expect(normal).not.toBe(wide);
    expect(compact).toContain("16rem");
    expect(normal).toContain("20rem");
    expect(wide).toContain("24rem");
    expect(compact).not.toContain("${");
    expect(cypherDockReserveClass("normal")).toContain("pr-[min(100vw,20rem)]");
    expect(cypherDockRightClass("wide")).toContain("right-[min(100vw,24rem)]");
  });
});
