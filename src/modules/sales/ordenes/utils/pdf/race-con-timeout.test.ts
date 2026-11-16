import { afterEach, describe, expect, it, vi } from "vitest";
import { raceConTimeout } from "./race-con-timeout";

describe("raceConTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resuelve la promesa y limpia el timer", async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const resultPromise = raceConTimeout(
      Promise.resolve("ok"),
      45_000,
      "timeout",
    );
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toBe("ok");
    expect(clearSpy).toHaveBeenCalled();
  });

  it("rechaza por timeout", async () => {
    vi.useFakeTimers();
    const resultPromise = raceConTimeout(
      new Promise<string>(() => {}),
      1_000,
      "La generación del PDF está tardando demasiado.",
    );
    const assertion = expect(resultPromise).rejects.toThrow(
      /tardando demasiado/,
    );
    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;
  });
});
