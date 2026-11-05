import { describe, expect, it } from "vitest";
import { TABLA_COMPACTA_PANTALLA_BAJA } from "./tabla-compacta";

describe("TABLA_COMPACTA_PANTALLA_BAJA", () => {
  const clases = TABLA_COMPACTA_PANTALLA_BAJA.split(" ");

  it("solo actúa en pantallas bajas: todas las clases llevan la condición de alto", () => {
    expect(clases.length).toBeGreaterThan(0);
    for (const clase of clases) {
      expect(clase.startsWith("[@media(max-height:50rem)]:")).toBe(true);
    }
  });

  it("baja las filas de 3,25 rem a 2,5 rem y reserva el alto de 5 filas compactas", () => {
    expect(clases).toContain("[@media(max-height:50rem)]:[&_tbody_tr]:h-10");
    // 5 filas × 2,5 rem = 12,5 rem
    expect(clases).toContain("[@media(max-height:50rem)]:[&_.polaria-scrollbar]:min-h-[12.5rem]!");
    expect(clases).toContain("[@media(max-height:50rem)]:[&_.overflow-x-hidden]:min-h-[12.5rem]!");
  });

  it("achica la franja de filtros de correos sin quitar los rótulos a los lectores de pantalla", () => {
    expect(clases).toContain("[@media(max-height:50rem)]:[&_[role=search]]:py-1.5");
    expect(clases).toContain("[@media(max-height:50rem)]:[&_[role=search]_label]:sr-only");
  });

  it("ajusta también el encabezado, los títulos de columna y la paginación", () => {
    expect(clases).toContain("[@media(max-height:50rem)]:[&>header]:py-2");
    expect(clases).toContain("[@media(max-height:50rem)]:[&_th]:py-2");
    expect(clases).toContain("[@media(max-height:50rem)]:[&>footer]:py-2");
  });
});
