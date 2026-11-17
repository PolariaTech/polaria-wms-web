import { describe, expect, it } from "vitest";
import { FILTROS_CORREOS_VACIOS } from "../types/correos.types";
import { escribirEstadoLista, leerEstadoLista } from "./estado-lista-url";

describe("estado-lista-url", () => {
  it("lee pagina, remitente y desde", () => {
    const params = new URLSearchParams(
      "pagina=3&remitente=hotel&desde=2026-11-01",
    );
    expect(leerEstadoLista(params)).toEqual({
      pagina: 3,
      filtros: {
        remitente: "hotel",
        asunto: "",
        desde: "2026-11-01",
        hasta: "",
      },
    });
  });

  it("vacío arranca en la página 1 sin filtros", () => {
    expect(leerEstadoLista(new URLSearchParams())).toEqual({
      pagina: 1,
      filtros: FILTROS_CORREOS_VACIOS,
    });
  });

  it.each(["abc", "0", "-2", "2.5"])("pagina %j se lee como 1", (pagina) => {
    expect(leerEstadoLista(new URLSearchParams(`pagina=${pagina}`)).pagina).toBe(
      1,
    );
  });

  it("solo acepta fechas AAAA-MM-DD", () => {
    expect(
      leerEstadoLista(new URLSearchParams("desde=11/01/2026")).filtros.desde,
    ).toBe("");
    expect(
      leerEstadoLista(new URLSearchParams("hasta=2026-13")).filtros.hasta,
    ).toBe("");
  });

  it("recorta el remitente a 120 caracteres", () => {
    const remitente = "x".repeat(200);
    expect(
      leerEstadoLista(new URLSearchParams({ remitente })).filtros.remitente,
    ).toHaveLength(120);
  });

  it("no escribe la página 1 ni filtros vacíos", () => {
    expect(
      escribirEstadoLista({ pagina: 1, filtros: FILTROS_CORREOS_VACIOS }),
    ).toBe("");
  });

  it("escribe en orden fijo y omite vacíos", () => {
    expect(
      escribirEstadoLista({
        pagina: 2,
        filtros: {
          remitente: "a b",
          asunto: "",
          desde: "2026-11-01",
          hasta: "",
        },
      }),
    ).toBe("pagina=2&remitente=a+b&desde=2026-11-01");
  });

  it("ida y vuelta conserva pagina y filtros", () => {
    const estado = {
      pagina: 2,
      filtros: {
        remitente: "a b",
        asunto: "",
        desde: "2026-11-01",
        hasta: "",
      },
    };
    expect(leerEstadoLista(new URLSearchParams(escribirEstadoLista(estado)))).toEqual(
      estado,
    );
  });
});
