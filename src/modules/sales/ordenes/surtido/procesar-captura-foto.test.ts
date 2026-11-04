import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mensajeErrorCaptura,
  procesarFotoSurtido,
  procesarIntento,
  type EntradaFoto,
} from "./procesar-captura-foto";

const m = vi.hoisted(() => ({
  subir: vi.fn(),
  extraer: vi.fn(),
  hoja: vi.fn(),
  ia: vi.fn(),
  calidad: vi.fn(),
  upsert: vi.fn(),
  estado: vi.fn(),
  aplicar: vi.fn(),
  procesando: vi.fn(),
  lista: vi.fn(),
  fallo: vi.fn(),
  guardarUrl: vi.fn(),
}));

vi.mock("@/lib/cloudinary/upload-evidencia", () => ({ uploadEvidenciaImage: m.subir }));
vi.mock("../ai/file-extractors", () => ({ extractFiles: m.extraer }));
vi.mock("./estimate-surtido-precision", () => ({ estimateSurtidoPrecision: () => 80 }));
vi.mock("./openai-surtido.client", () => ({ extraerSurtidoDesdeFoto: m.ia }));
vi.mock("./validate-surtido-foto-calidad", () => ({ evaluarCalidadFotoSurtido: m.calidad }));
vi.mock("./orden-surtido.service", () => ({
  buildPrintDataAdmin: m.hoja,
  upsertOrdenSurtidoCaptura: m.upsert,
  syncOrdenVentaEstadoAlistamiento: m.estado,
  applySurtidoCapturaToOrdenVenta: m.aplicar,
}));
vi.mock("./captura-intento.service", () => ({
  marcarProcesando: m.procesando,
  marcarLista: m.lista,
  marcarFallo: m.fallo,
  guardarUrlFoto: m.guardarUrl,
}));

const ENTRADA: EntradaFoto = {
  idOrdenVenta: "ov-1",
  idOrdenTrabajo: "pedido:1|almacen:a",
  codigoCuenta: "1YW43",
  buffer: Buffer.from([1, 2, 3]),
  nombre: "hoja.jpg",
  mime: "image/jpeg",
};

const REF = { idIntento: "id-1", esquema: "emp_demo" };

function diferida<T>() {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((r) => {
    resolver = r;
  });
  return { promesa, resolver };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  m.extraer.mockResolvedValue([{ tipo: "imagen", mime: "image/jpeg", base64: "AAA" }]);
  m.hoja.mockResolvedValue({ idOrdenTrabajo: "pedido:1|almacen:a", lineas: [{}, {}] });
  m.ia.mockResolvedValue({ payload: { lineas: [], calidadFoto: {} }, modelo: "gpt-4o" });
  m.calidad.mockReturnValue({ ok: true });
  m.subir.mockResolvedValue({ ok: true, url: "https://foto/1.jpg" });
  m.upsert.mockResolvedValue({ idCaptura: "c-1" });
  m.estado.mockResolvedValue({ estado: "revisada", updated: true });
  m.aplicar.mockResolvedValue({ updatedHeader: true, updatedLineas: 2 });
  m.procesando.mockResolvedValue(undefined);
  m.lista.mockResolvedValue(undefined);
  m.fallo.mockResolvedValue(undefined);
  m.guardarUrl.mockResolvedValue(undefined);
});

describe("procesarFotoSurtido", () => {
  it("lee la hoja, guarda la captura y devuelve estado, URL y tiempos por etapa", async () => {
    const resultado = await procesarFotoSurtido(ENTRADA);

    expect(resultado).toMatchObject({
      ok: true,
      modelo: "gpt-4o",
      urlFoto: "https://foto/1.jpg",
      estadoAlistamiento: "revisada",
      precisionEstimada: 80,
    });
    expect(m.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ idOrdenVenta: "ov-1", codigoCuenta: "1YW43", urlFoto: "https://foto/1.jpg" }),
    );
    if (resultado.ok) {
      expect(Object.keys(resultado.tiempos)).toEqual(
        expect.arrayContaining(["lectura_hoja", "cloudinary", "ia", "guardar", "estado_ov", "total"]),
      );
    }
  });

  it("sube la foto MIENTRAS la IA la lee, no después", async () => {
    const ia = diferida<{ payload: object; modelo: string }>();
    m.ia.mockReturnValue(ia.promesa);

    const proceso = procesarFotoSurtido(ENTRADA);
    await vi.waitFor(() => expect(m.subir).toHaveBeenCalled());
    expect(m.upsert).not.toHaveBeenCalled(); // la IA aún no terminó

    ia.resolver({ payload: { lineas: [] }, modelo: "gpt-4o" });
    await expect(proceso).resolves.toMatchObject({ ok: true });
  });

  it("avisa en cuanto la foto queda guardada, para poder reintentar aunque la IA falle", async () => {
    const alSubirFoto = vi.fn();
    m.ia.mockRejectedValue(new Error("OpenAI timeout"));

    const resultado = await procesarFotoSurtido({ ...ENTRADA, alSubirFoto });

    expect(alSubirFoto).toHaveBeenCalledWith("https://foto/1.jpg");
    expect(resultado).toMatchObject({ ok: false, urlFoto: "https://foto/1.jpg" });
  });

  it("en un reintento no vuelve a subir la foto y usa la ya guardada", async () => {
    const resultado = await procesarFotoSurtido({ ...ENTRADA, urlFotoGuardada: "https://foto/vieja.jpg" });

    expect(m.subir).not.toHaveBeenCalled();
    expect(resultado).toMatchObject({ ok: true, urlFoto: "https://foto/vieja.jpg" });
  });

  it("si falla la subida a Cloudinary guarda la captura igual, sin evidencia", async () => {
    m.subir.mockRejectedValue(new Error("cloudinary caído"));

    const resultado = await procesarFotoSurtido(ENTRADA);

    expect(resultado).toMatchObject({ ok: true, urlFoto: null });
    expect(m.upsert).toHaveBeenCalledWith(expect.objectContaining({ urlFoto: null }));
  });

  it("una foto de mala calidad se rechaza con 422, sin guardar captura, pero conserva la foto", async () => {
    m.calidad.mockReturnValue({ ok: false, codigo: "foto_mala", error: "La foto fue tomada mal." });

    const resultado = await procesarFotoSurtido(ENTRADA);

    expect(resultado).toMatchObject({
      ok: false,
      status: 422,
      codigo: "foto_mala",
      error: "La foto fue tomada mal.",
      urlFoto: "https://foto/1.jpg",
    });
    expect(m.upsert).not.toHaveBeenCalled();
    expect(m.aplicar).not.toHaveBeenCalled();
  });

  it("una imagen que no se puede leer es un 400", async () => {
    m.extraer.mockResolvedValue([{ tipo: "texto" }]);

    await expect(procesarFotoSurtido(ENTRADA)).resolves.toMatchObject({
      ok: false,
      status: 400,
      codigo: "imagen_ilegible",
    });
    expect(m.ia).not.toHaveBeenCalled();
  });

  it("una orden inexistente es un 404", async () => {
    m.hoja.mockResolvedValue(null);

    await expect(procesarFotoSurtido(ENTRADA)).resolves.toMatchObject({
      ok: false,
      status: 404,
      codigo: "orden_no_encontrada",
    });
  });

  it("si la IA falla dos veces responde con un mensaje claro, no con el error técnico", async () => {
    m.ia.mockRejectedValue(new Error("OpenAI rate limit"));

    const resultado = await procesarFotoSurtido(ENTRADA);

    expect(m.ia).toHaveBeenCalledTimes(2);
    expect(resultado).toMatchObject({
      ok: false,
      status: 500,
      codigo: "error_proceso",
      error: "Mateo no pudo analizar la foto ahora. Espera unos segundos e intenta de nuevo.",
    });
  });

  it("si no se puede avanzar el estado de la OV, la captura sigue siendo válida", async () => {
    m.estado.mockRejectedValue(new Error("bd"));
    m.aplicar.mockRejectedValue(new Error("no se pudo sincronizar"));

    const resultado = await procesarFotoSurtido(ENTRADA);

    expect(resultado).toMatchObject({
      ok: true,
      estadoAlistamiento: null,
      ovSync: { updatedHeader: false, updatedLineas: 0, error: "no se pudo sincronizar" },
    });
  });
});

describe("procesarIntento", () => {
  it("marca procesando y al terminar deja el intento en lista con modelo, URL y tiempos", async () => {
    const resultado = await procesarIntento(REF, ENTRADA);

    expect(resultado.ok).toBe(true);
    expect(m.procesando).toHaveBeenCalledWith(REF);
    expect(m.guardarUrl).toHaveBeenCalledWith(REF, "https://foto/1.jpg");
    expect(m.lista).toHaveBeenCalledWith(
      REF,
      expect.objectContaining({ modelo: "gpt-4o", urlFoto: "https://foto/1.jpg" }),
    );
    expect(m.fallo).not.toHaveBeenCalled();
  });

  it("si la lectura falla deja el intento en fallo con el motivo para la pantalla", async () => {
    m.calidad.mockReturnValue({ ok: false, codigo: "foto_mala", error: "La foto fue tomada mal." });

    const resultado = await procesarIntento(REF, ENTRADA);

    expect(resultado.ok).toBe(false);
    expect(m.fallo).toHaveBeenCalledWith(
      REF,
      expect.objectContaining({ codigo: "foto_mala", mensaje: "La foto fue tomada mal." }),
    );
    expect(m.lista).not.toHaveBeenCalled();
  });

  it("si falla el guardado del estado lo reintenta una vez", async () => {
    m.lista.mockRejectedValueOnce(new Error("bd")).mockResolvedValue(undefined);

    await procesarIntento(REF, ENTRADA);

    expect(m.lista).toHaveBeenCalledTimes(2);
  });

  it("nunca lanza, aunque no se pueda guardar el estado", async () => {
    m.procesando.mockRejectedValue(new Error("bd"));
    m.lista.mockRejectedValue(new Error("bd"));

    await expect(procesarIntento(REF, ENTRADA)).resolves.toMatchObject({ ok: true });
  });
});

describe("mensajeErrorCaptura", () => {
  it("traduce los errores técnicos a mensajes para el celular", () => {
    expect(mensajeErrorCaptura(new Error("ETIMEDOUT"))).toMatch(/mateo no pudo analizar/i);
    expect(mensajeErrorCaptura(new Error("JSON inválido"))).toMatch(/no se entendió la foto/i);
    expect(mensajeErrorCaptura(new Error(""))).toMatch(/no se pudo leer la foto/i);
    expect(mensajeErrorCaptura(new Error("Algo corto y claro"))).toBe("Algo corto y claro");
    expect(mensajeErrorCaptura(new Error("x".repeat(200)))).toMatch(/revisa el encuadre/i);
  });
});
