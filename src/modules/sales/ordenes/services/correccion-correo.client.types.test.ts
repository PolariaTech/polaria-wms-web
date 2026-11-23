import { describe, expect, it } from "vitest";
import { CorreccionCorreoApiError } from "./correccion-correo.client.types";

describe("CorreccionCorreoApiError", () => {
  it("conserva código y status", () => {
    const err = new CorreccionCorreoApiError("msg", "NO_ENCONTRADA", 404);
    expect(err.name).toBe("CorreccionCorreoApiError");
    expect(err.codigo).toBe("NO_ENCONTRADA");
    expect(err.status).toBe(404);
    expect(err.message).toBe("msg");
  });
});