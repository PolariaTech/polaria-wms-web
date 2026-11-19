import { describe, expect, it } from "vitest";
import { buildCypherLogQuery } from "./cypher-drawer-log";

describe("cypher-drawer-log / buildCypherLogQuery", () => {
  it("arma el fetch sin autor de vendedor (REQ-325)", () => {
    const query = buildCypherLogQuery({
      idOrdenVenta: "ov-1",
      codigoCuenta: "CTA",
      idOrdenTrabajo: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect("autor" in query).toBe(false);
    expect(query.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
