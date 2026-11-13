import { describe, expect, it } from "vitest";
import {
  ETIQUETA_ACEPTAR_NUEVA_VERSION,
  MENSAJE_NUEVA_VERSION_PRODUCTO,
  PRODUCT_VERSION_API_PATH,
  PRODUCT_VERSION_CHECK_INTERVAL_MS,
} from "./product-version-constants";

describe("product-version-constants", () => {
  it("expone el copy y la ruta del gate REQ-293", () => {
    expect(PRODUCT_VERSION_API_PATH).toBe("/api/product-version");
    expect(PRODUCT_VERSION_CHECK_INTERVAL_MS).toBeGreaterThan(0);
    expect(MENSAJE_NUEVA_VERSION_PRODUCTO).toMatch(/nueva versión/i);
    expect(ETIQUETA_ACEPTAR_NUEVA_VERSION).toBe("Aceptar");
  });
});
