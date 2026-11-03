import { describe, expect, it } from "vitest";
import { ordenPasaFiltroFechaEntrega } from "./filtrar-por-fecha-entrega";

const DIA = "2026-10-28";
const ZONA = "America/Cancun";

describe("ordenPasaFiltroFechaEntrega", () => {
  it("deja pasar la orden sin fecha de entrega", () => {
    expect(ordenPasaFiltroFechaEntrega(null, DIA, ZONA)).toBe(true);
    expect(ordenPasaFiltroFechaEntrega(undefined, DIA, ZONA)).toBe(true);
    expect(ordenPasaFiltroFechaEntrega("  ", DIA, ZONA)).toBe(true);
  });

  it("acepta la entrega de ese día y la del día siguiente", () => {
    expect(ordenPasaFiltroFechaEntrega("2026-10-28", DIA, ZONA)).toBe(true);
    expect(
      ordenPasaFiltroFechaEntrega("2026-10-28T15:00:00.000Z", DIA, ZONA),
    ).toBe(true);
    expect(ordenPasaFiltroFechaEntrega("2026-10-29", DIA, ZONA)).toBe(true);
    expect(
      ordenPasaFiltroFechaEntrega("2026-10-29T15:00:00.000Z", DIA, ZONA),
    ).toBe(true);
    expect(ordenPasaFiltroFechaEntrega("2026-10-30", DIA, ZONA)).toBe(false);
    expect(ordenPasaFiltroFechaEntrega("2026-10-27", DIA, ZONA)).toBe(false);
  });

  it("cruza el fin de mes y el fin de año", () => {
    expect(ordenPasaFiltroFechaEntrega("2026-11-01", "2026-10-31", ZONA)).toBe(
      true,
    );
    expect(ordenPasaFiltroFechaEntrega("2026-11-02", "2026-10-31", ZONA)).toBe(
      false,
    );
    expect(ordenPasaFiltroFechaEntrega("2027-01-01", "2026-12-31", ZONA)).toBe(
      true,
    );
  });

  it("no usa la fecha de creación: solo compara la de entrega", () => {
    expect(ordenPasaFiltroFechaEntrega("2026-10-01", DIA, ZONA)).toBe(false);
  });
});
