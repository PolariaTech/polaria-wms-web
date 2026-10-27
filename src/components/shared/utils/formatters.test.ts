import { describe, expect, it } from "vitest";
import { calendarDayKey } from "./formatters";

describe("calendarDayKey", () => {
  it("usa el día de la zona de la cuenta, no el del reloj UTC", () => {
    expect(
      calendarDayKey("2026-10-27T04:30:00.000Z", "America/Cancun"),
    ).toBe("2026-10-26");
    expect(
      calendarDayKey("2026-10-27T06:00:00.000Z", "America/Cancun"),
    ).toBe("2026-10-27");
  });

  it("devuelve vacío si la fecha no se puede leer", () => {
    expect(calendarDayKey("no-es-fecha", "America/Cancun")).toBe("");
  });
});
