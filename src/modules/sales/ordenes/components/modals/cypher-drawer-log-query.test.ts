import { describe, expect, it } from "vitest";
import { buildCypherLogQuery } from "./cypher-drawer-log-query";

describe("buildCypherLogQuery", () => {
  it("no expone autor ni vendedor (REQ-325)", () => {
    const query = buildCypherLogQuery({
      idOrdenVenta: "ov-1",
      codigoCuenta: "CTA",
      idOrdenTrabajo: "ot-1",
      createdAt: "2026-06-01T00:00:00.000Z",
    });
    expect(query).toEqual({
      idOrdenVenta: "ov-1",
      codigoCuenta: "CTA",
      idOrdenTrabajo: "ot-1",
      createdAt: "2026-06-01T00:00:00.000Z",
    });
    expect(query).not.toHaveProperty("autor");
    expect(query).not.toHaveProperty("vendedor");
  });
});
