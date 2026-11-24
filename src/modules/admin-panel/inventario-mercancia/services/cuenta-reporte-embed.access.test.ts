import { describe, expect, it } from "vitest";
import * as part from "./cuenta-reporte-embed.access";

describe("cuenta-reporte-embed.access", () => {
  it("expone funciones públicas", () => {
    const names = Object.keys(part).filter(
      (key) => typeof (part as Record<string, unknown>)[key] === "function",
    );
    expect(names.length).toBeGreaterThan(0);
  });
});

import { extractBearerToken } from "./cuenta-reporte-embed.access";

describe("extractBearerToken", () => {
  it("extrae el token Bearer", () => {
    const request = new Request("http://x", {
      headers: { authorization: "Bearer abc " },
    });
    expect(extractBearerToken(request)).toBe("abc");
  });

  it("devuelve null sin cabecera válida", () => {
    expect(extractBearerToken(new Request("http://x"))).toBeNull();
    expect(
      extractBearerToken(
        new Request("http://x", { headers: { authorization: "Basic x" } }),
      ),
    ).toBeNull();
  });
});
