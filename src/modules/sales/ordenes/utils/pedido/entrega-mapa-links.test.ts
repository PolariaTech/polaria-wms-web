import { describe, expect, it } from "vitest";
import {
  isEntregaCoordsValid,
  textoCoords,
  urlGoogleMaps,
  urlWaze,
} from "./entrega-mapa-links";

describe("entrega-mapa-links (REQ-251)", () => {
  it("valida coordenadas", () => {
    expect(isEntregaCoordsValid(20.62, -87.07)).toBe(true);
    expect(isEntregaCoordsValid(null, -87)).toBe(false);
    expect(isEntregaCoordsValid(100, 0)).toBe(false);
  });

  it("arma enlaces Waze y Google Maps", () => {
    const c = { lat: 20.6296, lng: -87.0739 };
    expect(urlWaze(c)).toContain("20.6296");
    expect(urlGoogleMaps(c, "Playa del Carmen")).toContain(
      encodeURIComponent("Playa del Carmen"),
    );
    expect(textoCoords(c)).toBe("20.629600, -87.073900");
  });
});
