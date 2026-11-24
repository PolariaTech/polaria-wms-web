import { describe, expect, it } from "vitest";
import * as barrel from "./impresoras.service";
import * as part from "./impresoras.service.labels";

describe("impresoras.service.labels", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.suggestModoEnvio).toBe(part.suggestModoEnvio);
    expect(barrel.labelTipoConexion).toBe(part.labelTipoConexion);
    expect(barrel.labelModoEnvio).toBe(part.labelModoEnvio);
    expect(barrel.caminoFromModoEnvio).toBe(part.caminoFromModoEnvio);
    expect(barrel.labelCaminoImpresora).toBe(part.labelCaminoImpresora);
    expect(barrel.defaultsForCamino).toBe(part.defaultsForCamino);
    expect(barrel.labelPais).toBe(part.labelPais);
  });
});
