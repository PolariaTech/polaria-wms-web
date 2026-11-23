import { describe, expect, it } from "vitest";
import {
  buildEmptySection,
  ORDENES_EN_TRANSPORTE,
} from "./custodio-ingreso-page.helpers";

describe("custodio-ingreso-page.helpers", () => {
  it("ORDENES_EN_TRANSPORTE contiene emitida y parcialmente_recibida", () => {
    expect([...ORDENES_EN_TRANSPORTE].sort()).toEqual([
      "emitida",
      "parcialmente_recibida",
    ]);
  });

  it("buildEmptySection crea slots vacíos según la capacidad", () => {
    const section = buildEmptySection("entrada");

    expect(section.id).toBe("entrada");
    expect(section.slots).toHaveLength(section.capacity);
    expect(section.slots.every((slot) => slot.visual === "vacia")).toBe(true);
    expect(section.slots[0]?.slotNumber).toBe(1);
    expect(section.occupiedCount).toBe(0);
  });
});
