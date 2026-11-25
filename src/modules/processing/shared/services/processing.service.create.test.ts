import { describe, expect, it } from "vitest";
import * as barrel from "./processing.service";
import * as part from "./processing.service.create";

describe("processing.service.create", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.createSolicitudProcesamiento).toBe(part.createSolicitudProcesamiento);
  });
});
