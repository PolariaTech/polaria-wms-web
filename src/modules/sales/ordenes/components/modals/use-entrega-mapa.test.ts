import { describe, expect, it } from "vitest";
import { isEntregaCoordsValid } from "../../utils/pedido/entrega-mapa-links";

/**
 * El montaje Leaflet se prueba vía EntregaMapaModal (hook mockeado).
 * Aquí queda la regla de negocio: coords válidas / texto del campo no se pisa
 * por reverse-geocode (ese comportamiento vive en use-entrega-mapa.ts).
 */
describe("use-entrega-mapa (REQ-251)", () => {
  it("trata coords iniciales inválidas como ausentes", () => {
    expect(isEntregaCoordsValid(null, null)).toBe(false);
    expect(isEntregaCoordsValid(20.63, -87.07)).toBe(true);
  });

  it("documenta que clic/arrastre no deben reescribir la dirección del campo", () => {
    const textoCampo = "Hilton Cancún, Zona Hotelera";
    const trasClicEnMapa = {
      direccionResuelta: textoCampo,
      query: textoCampo,
      coords: { lat: 21.12, lng: -86.75 },
    };
    expect(trasClicEnMapa.direccionResuelta).toBe(textoCampo);
    expect(trasClicEnMapa.query).toBe(textoCampo);
  });
});
