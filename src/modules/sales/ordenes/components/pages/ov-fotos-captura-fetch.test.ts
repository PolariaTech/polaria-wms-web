import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchFotosCaptura,
  MENSAJE_ERROR_FOTOS,
  mensajeErrorFotos,
} from "./ov-fotos-captura-fetch";

const fetchMock = vi.fn();

function responder(body: unknown, ok = true) {
  fetchMock.mockResolvedValue({ ok, json: async () => body });
}

describe("ov-fotos-captura-fetch", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mensajeErrorFotos usa el del Error o el genérico", () => {
    expect(mensajeErrorFotos(new Error("sin red"))).toBe("sin red");
    expect(mensajeErrorFotos("x")).toBe(MENSAJE_ERROR_FOTOS);
  });

  it("sin OT pide solo el historial de la OV (con el id escapado) y devuelve las OT", async () => {
    responder({ ordenesTrabajo: [{ id: "ot-1" }], fotos: [{ urlFoto: "u" }] });
    const r = await fetchFotosCaptura("ov/1");
    expect(fetchMock).toHaveBeenCalledWith("/captura-orden/ov%2F1/api?historial=1");
    expect(r.ordenesTrabajo).toEqual([{ id: "ot-1" }]);
  });

  it("con OT agrega el parámetro ot y limpia fotos sin URL", async () => {
    responder({
      fotos: [
        { idFoto: "f1", idOrdenTrabajo: "ot-2", urlFoto: "  http://x/1.jpg  ", createdAt: "2026-01-01" },
        { idFoto: "f2", urlFoto: "   " },
        { idFoto: "f3", urlFoto: null },
      ],
    });
    const r = await fetchFotosCaptura("ov-1", "ot-2");
    expect(fetchMock).toHaveBeenCalledWith("/captura-orden/ov-1/api?historial=1&ot=ot-2");
    expect(r.fotos).toEqual([
      { idFoto: "f1", idOrdenTrabajo: "ot-2", urlFoto: "http://x/1.jpg", createdAt: "2026-01-01" },
    ]);
    expect(r.ordenesTrabajo).toEqual([]);
  });

  it("una respuesta no OK lanza el error del servidor, o el genérico", async () => {
    responder({ error: "sin permiso" }, false);
    await expect(fetchFotosCaptura("ov-1")).rejects.toThrow("sin permiso");
    responder({}, false);
    await expect(fetchFotosCaptura("ov-1")).rejects.toThrow(MENSAJE_ERROR_FOTOS);
  });

  it("si falla la red o el cuerpo no es JSON lanza el error genérico", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("network down"));
    await expect(fetchFotosCaptura("ov-1")).rejects.toThrow(MENSAJE_ERROR_FOTOS);

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new SyntaxError("invalid json");
      },
    });
    await expect(fetchFotosCaptura("ov-1")).rejects.toThrow(MENSAJE_ERROR_FOTOS);
  });
});
