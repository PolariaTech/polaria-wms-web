import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enviarFoto,
  fileKey,
  mensajeErrorCamara,
  mensajeErrorRespuesta,
  prepararFoto,
  readFirstFile,
} from "./captura-upload-utils";

const compressMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/images/compress-image-file", () => ({
  compressImageFile: compressMock,
}));

function foto(nombre = "hoja.jpg"): File {
  return new File([new Uint8Array([1, 2, 3])], nombre, { type: "image/jpeg" });
}

afterEach(() => {
  vi.useRealTimers();
  compressMock.mockReset();
});

describe("mensajeErrorRespuesta", () => {
  it("usa el mensaje del servidor cuando lo hay", () => {
    expect(mensajeErrorRespuesta({ error: "  Algo concreto " }, 500)).toBe(
      "Algo concreto",
    );
  });

  it("traduce el código HTTP cuando el servidor no explica", () => {
    expect(mensajeErrorRespuesta({}, 422)).toMatch(/tomada mal/i);
    expect(mensajeErrorRespuesta({}, 413)).toMatch(/no se pudo enviar/i);
    expect(mensajeErrorRespuesta({}, 503)).toMatch(/mateo no pudo analizar/i);
    expect(mensajeErrorRespuesta({}, 0)).toMatch(/error de red/i);
    expect(mensajeErrorRespuesta({}, 404)).toMatch(/\(404\)/);
  });
});

describe("mensajeErrorCamara", () => {
  it("distingue permiso denegado, sin cámara y el resto", () => {
    expect(mensajeErrorCamara(new DOMException("x", "NotAllowedError"))).toMatch(
      /permiso de cámara denegado/i,
    );
    expect(mensajeErrorCamara(new DOMException("x", "NotFoundError"))).toMatch(
      /no se encontró cámara/i,
    );
    expect(mensajeErrorCamara(new Error("otro"))).toMatch(/no se pudo abrir/i);
  });
});

describe("fileKey y readFirstFile", () => {
  it("la clave cambia si cambia el archivo", () => {
    expect(fileKey(foto("a.jpg"))).not.toBe(fileKey(foto("b.jpg")));
  });

  it("lee el primer archivo del primer input que tenga uno", () => {
    const archivo = foto();
    const vacio = document.createElement("input");
    const conArchivo = document.createElement("input");
    Object.defineProperty(conArchivo, "files", { value: { 0: archivo, length: 1 } });

    expect(readFirstFile(null, vacio, conArchivo)).toBe(archivo);
    expect(readFirstFile(null, vacio)).toBeNull();
  });
});

describe("enviarFoto", () => {
  it("hace POST pidiendo JSON y devuelve el id del intento que responde el servidor", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ ok: true, idIntento: "id-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const body = new FormData();

    const respuesta = await enviarFoto("/captura-orden/ov-1/api", body);

    expect(respuesta).toEqual({ ok: true, status: 202, data: { ok: true, idIntento: "id-1" } });
    expect(fetchMock).toHaveBeenCalledWith("/captura-orden/ov-1/api", {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });
  });

  it("si el cuerpo no es JSON devuelve datos vacíos y conserva el código HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error("no es json");
        },
      }),
    );

    await expect(enviarFoto("/x")).resolves.toEqual({ ok: false, status: 502, data: {} });
  });
});

describe("prepararFoto", () => {
  it("devuelve la foto comprimida", async () => {
    const comprimida = foto("comprimida.jpg");
    compressMock.mockResolvedValue(comprimida);

    await expect(prepararFoto(foto())).resolves.toBe(comprimida);
  });

  it("si comprimir falla, sube el original", async () => {
    const original = foto();
    compressMock.mockRejectedValue(new Error("no se pudo"));

    await expect(prepararFoto(original)).resolves.toBe(original);
  });

  it("si comprimir tarda más de 10 s, sube el original", async () => {
    vi.useFakeTimers();
    const original = foto();
    compressMock.mockReturnValue(new Promise(() => {}));

    const resultado = prepararFoto(original);
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(resultado).resolves.toBe(original);
  });
});
