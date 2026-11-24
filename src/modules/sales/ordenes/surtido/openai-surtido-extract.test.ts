import { describe, expect, it } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import { extraerSurtidoDesdeFoto } from "./openai-surtido-extract";

const original = {
  folio: "OV-1",
  lineas: [],
} as OrdenTareaAlmacenPrintData;

describe("extraerSurtidoDesdeFoto", () => {
  it("falla sin OPENAI_API_KEY", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    await expect(
      extraerSurtidoDesdeFoto({
        original,
        mime: "image/jpeg",
        base64: "abc",
      }),
    ).rejects.toThrow("OPENAI_API_KEY");
    if (prev) process.env.OPENAI_API_KEY = prev;
  });
});