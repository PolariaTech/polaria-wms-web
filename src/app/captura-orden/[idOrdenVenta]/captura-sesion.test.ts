import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SUBIENDO_VENCE_MS,
  estadoVisible,
  fusionarRegistro,
  otrasHojas,
  parsearRegistros,
  registrarCaptura,
  type RegistroCaptura,
} from "./captura-sesion";

const AHORA = 1_800_000_000_000;

function registro(
  sobrescribir: Partial<RegistroCaptura> = {},
): RegistroCaptura {
  return {
    idOrdenVenta: "ov-1",
    idOrdenTrabajo: "ot-1",
    folio: "OV-00001",
    estado: "lista",
    at: AHORA,
    ...sobrescribir,
  };
}

describe("parsearRegistros", () => {
  it("devuelve lista vacía con texto vacío, nulo o dañado", () => {
    expect(parsearRegistros(null)).toEqual([]);
    expect(parsearRegistros("")).toEqual([]);
    expect(parsearRegistros("{no es json")).toEqual([]);
    expect(parsearRegistros('{"a":1}')).toEqual([]);
  });

  it("acepta la etiqueta de OT opcional y descarta una que no sea texto", () => {
    const conEtiqueta = registro({ etiqueta: "OT 2/9" });
    const crudo = JSON.stringify([
      conEtiqueta,
      { ...registro({ idOrdenTrabajo: "ot-2" }), etiqueta: 5 },
    ]);
    expect(parsearRegistros(crudo)).toEqual([conEtiqueta]);
  });

  it("acepta «procesando» con el id del intento y el motivo, y descarta ids que no sean texto", () => {
    const procesando = registro({ estado: "procesando", idIntento: "id-1", mensaje: "motivo" });
    const crudo = JSON.stringify([
      procesando,
      { ...registro({ idOrdenTrabajo: "ot-2" }), idIntento: 7 },
      { ...registro({ idOrdenTrabajo: "ot-3" }), mensaje: {} },
    ]);
    expect(parsearRegistros(crudo)).toEqual([procesando]);
  });

  it("descarta entradas con forma inválida y conserva las buenas", () => {
    const buena = registro();
    const crudo = JSON.stringify([
      buena,
      { ...buena, estado: "otro" },
      { ...buena, at: "ayer" },
      null,
    ]);
    expect(parsearRegistros(crudo)).toEqual([buena]);
  });
});

describe("fusionarRegistro", () => {
  it("reemplaza el registro de la misma hoja y lo pone primero", () => {
    const vieja = registro({ estado: "subiendo", at: AHORA - 1000 });
    const otra = registro({ idOrdenTrabajo: "ot-2", at: AHORA - 500 });
    const nueva = registro({ estado: "lista" });

    const resultado = fusionarRegistro([vieja, otra], nueva, AHORA);

    expect(resultado).toEqual([nueva, otra]);
  });

  it("descarta registros de hace más de 12 horas", () => {
    const antiguo = registro({
      idOrdenTrabajo: "ot-9",
      at: AHORA - 13 * 60 * 60 * 1000,
    });
    expect(fusionarRegistro([antiguo], registro(), AHORA)).toHaveLength(1);
  });

  it("guarda como máximo 20 hojas", () => {
    const muchas = Array.from({ length: 25 }, (_, i) =>
      registro({ idOrdenTrabajo: `ot-${i + 10}`, at: AHORA - i }),
    );
    expect(fusionarRegistro(muchas, registro(), AHORA)).toHaveLength(20);
  });
});

describe("estadoVisible", () => {
  it("una subida que no confirmó a tiempo se muestra como fallo", () => {
    const subiendo = registro({ estado: "subiendo" });
    expect(estadoVisible(subiendo, AHORA + 1000)).toBe("subiendo");
    expect(estadoVisible(subiendo, AHORA + SUBIENDO_VENCE_MS + 1)).toBe("fallo");
  });

  it("«procesando» no se da por perdido en el cliente: eso lo decide el servidor", () => {
    const procesando = registro({ estado: "procesando", idIntento: "id-1" });

    expect(estadoVisible(procesando, AHORA + SUBIENDO_VENCE_MS * 10)).toBe("procesando");
  });

  it("lista y fallo no cambian con el tiempo", () => {
    expect(estadoVisible(registro({ estado: "lista" }), AHORA + 10_000_000)).toBe(
      "lista",
    );
    expect(estadoVisible(registro({ estado: "fallo" }), AHORA)).toBe("fallo");
  });
});

describe("otrasHojas", () => {
  it("excluye la hoja propia, ordena por reciente y limita", () => {
    const propia = registro();
    const a = registro({ idOrdenTrabajo: "ot-a", at: AHORA - 3000 });
    const b = registro({ idOrdenTrabajo: "ot-b", at: AHORA - 1000 });
    const c = registro({ idOrdenVenta: "ov-2", at: AHORA - 2000 });

    const resultado = otrasHojas([propia, a, b, c], propia, AHORA, 2);

    expect(resultado).toEqual([b, c]);
  });
});

describe("registrarCaptura", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("guarda el registro en localStorage", () => {
    registrarCaptura(registro({ estado: "subiendo" }));

    const guardado = parsearRegistros(
      window.localStorage.getItem("polaria:captura:sesion"),
    );
    expect(guardado).toEqual([registro({ estado: "subiendo" })]);
  });

  it("no falla si localStorage no está disponible", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(() => registrarCaptura(registro())).not.toThrow();
  });
});
