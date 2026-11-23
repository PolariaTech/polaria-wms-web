import { describe, expect, it } from "vitest";
import { CAMION_LIST_COLUMNS } from "./camiones.types";

describe("camiones.types", () => {
  it("CAMION_LIST_COLUMNS incluye las columnas clave", () => {
    const columns = CAMION_LIST_COLUMNS.split(",");
    expect(columns).toContain("id_camion");
    expect(columns).toContain("esta_activo");
  });
});
