import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/empresa-logo", () => {
  it("rechaza una ruta que no es el logo de una empresa", async () => {
    const response = await GET(
      new Request("http://localhost/api/empresa-logo?path=../secreto.png"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Ruta de logo inválida.",
    });
  });
});
