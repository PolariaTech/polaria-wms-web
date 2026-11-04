// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  after: vi.fn(),
  crearIntento: vi.fn(),
  leerIntentos: vi.fn(),
  cargarIntento: vi.fn(),
  prepararReintento: vi.fn(),
  meta: vi.fn(),
  procesarIntento: vi.fn(),
  procesarFoto: vi.fn(),
  lectura: vi.fn(),
}));

vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: m.after,
}));
vi.mock("@/modules/sales/ordenes/surtido/captura-intento.service", () => ({
  crearIntento: m.crearIntento,
  leerIntentos: m.leerIntentos,
  cargarIntento: m.cargarIntento,
  prepararReintento: m.prepararReintento,
}));
vi.mock("@/modules/sales/ordenes/surtido/orden-surtido.service", () => ({
  getOrdenMetaPublica: m.meta,
}));
vi.mock("@/modules/sales/ordenes/surtido/procesar-captura-foto", () => ({
  mensajeErrorCaptura: (e: unknown) => `msg: ${e instanceof Error ? e.message : e}`,
  procesarFotoSurtido: m.procesarFoto,
  procesarIntento: m.procesarIntento,
}));
vi.mock("./captura-lecturas", () => ({ responderLectura: m.lectura }));

type Ruta = typeof import("./route");
const REF = { idIntento: "id-1", esquema: "emp_demo" };
const CONTEXTO = { params: Promise.resolve({ idOrdenVenta: "ov-1" }) };

async function ruta(): Promise<Ruta> {
  vi.resetModules();
  return import("./route");
}

function pedirFoto(url = "http://x/captura-orden/ov-1/api?ot=pedido%3A1%7Calmacen%3Aa", encabezados = {}) {
  const form = new FormData();
  form.set("foto", new File([new Uint8Array([1, 2, 3])], "hoja.jpg", { type: "image/jpeg" }));
  return new Request(url, {
    method: "POST",
    body: form,
    headers: { accept: "application/json", ...encabezados },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubEnv("OPENAI_API_KEY", "sk-prueba");
  m.meta.mockResolvedValue({ idOrdenVenta: "ov-1", codigoCuenta: "1YW43", folio: "OV-00001" });
  m.crearIntento.mockResolvedValue(REF);
  m.procesarIntento.mockResolvedValue({ ok: true });
  m.prepararReintento.mockResolvedValue(undefined);
  m.after.mockImplementation(() => undefined);
});

describe("POST: recibir la foto", () => {
  it("responde 202 de inmediato con el id del intento, sin esperar a la IA", async () => {
    const { POST } = await ruta();

    const respuesta = await POST(pedirFoto(), CONTEXTO);

    expect(respuesta.status).toBe(202);
    await expect(respuesta.json()).resolves.toEqual({
      ok: true,
      estado: "recibida",
      idIntento: "id-1",
      folio: "OV-00001",
    });
    expect(m.crearIntento).toHaveBeenCalledWith({
      idOrdenVenta: "ov-1",
      idOrdenTrabajo: "pedido:1|almacen:a",
      codigoCuenta: "1YW43",
    });
    expect(m.procesarFoto).not.toHaveBeenCalled();
  });

  it("deja la lectura con IA para después de responder (after)", async () => {
    const { POST } = await ruta();

    await POST(pedirFoto(), CONTEXTO);

    expect(m.procesarIntento).not.toHaveBeenCalled(); // aún no: solo se programó
    expect(m.after).toHaveBeenCalledTimes(1);

    await (m.after.mock.calls[0]![0] as () => Promise<void>)();
    expect(m.procesarIntento).toHaveBeenCalledWith(
      REF,
      expect.objectContaining({ idOrdenVenta: "ov-1", codigoCuenta: "1YW43", nombre: "hoja.jpg" }),
    );
  });

  it("varias fotos seguidas son intentos independientes", async () => {
    const { POST } = await ruta();
    m.crearIntento
      .mockResolvedValueOnce({ idIntento: "a", esquema: null })
      .mockResolvedValueOnce({ idIntento: "b", esquema: null });

    const [r1, r2] = await Promise.all([POST(pedirFoto(), CONTEXTO), POST(pedirFoto(), CONTEXTO)]);

    expect((await r1.json()).idIntento).toBe("a");
    expect((await r2.json()).idIntento).toBe("b");
    expect(m.after).toHaveBeenCalledTimes(2);
  });

  it("busca la OV una sola vez aunque lleguen varias fotos", async () => {
    const { POST } = await ruta();

    await POST(pedirFoto(), CONTEXTO);
    await POST(pedirFoto(), CONTEXTO);

    expect(m.meta).toHaveBeenCalledTimes(1);
  });

  it("sin JavaScript (formulario nativo) procesa en la misma petición y redirige", async () => {
    const { POST } = await ruta();
    m.procesarFoto.mockResolvedValue({
      ok: true,
      idOrdenTrabajo: "pedido:1|almacen:a",
      precisionEstimada: 75,
      captura: {},
      estadoAlistamiento: "revisada",
      ovSync: { updatedHeader: true, updatedLineas: 1 },
    });

    const respuesta = await POST(pedirFoto(undefined, { "sec-fetch-mode": "navigate", accept: "text/html" }), CONTEXTO);

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toContain("captura=ok");
    expect(m.crearIntento).not.toHaveBeenCalled();
    expect(m.after).not.toHaveBeenCalled();
  });
});

describe("POST: rechazos antes de recibir", () => {
  it("sin clave de OpenAI responde 503", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const { POST } = await ruta();

    expect((await POST(pedirFoto(), CONTEXTO)).status).toBe(503);
    expect(m.crearIntento).not.toHaveBeenCalled();
  });

  it("una orden inexistente responde 404 y no crea intento", async () => {
    const { POST } = await ruta();
    m.meta.mockResolvedValue(null);

    expect((await POST(pedirFoto(), CONTEXTO)).status).toBe(404);
    expect(m.crearIntento).not.toHaveBeenCalled();
  });

  it("sin foto responde 400", async () => {
    const { POST } = await ruta();
    const sinFoto = new Request("http://x/a?ot=ot-1", {
      method: "POST",
      body: new FormData(),
      headers: { accept: "application/json" },
    });

    const respuesta = await POST(sinFoto, CONTEXTO);

    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).error).toMatch(/adjunta una foto/i);
  });

  it("si no se puede reservar el intento responde con un mensaje claro y no programa nada", async () => {
    const { POST } = await ruta();
    m.crearIntento.mockRejectedValue(new Error("bd caída"));

    const respuesta = await POST(pedirFoto(), CONTEXTO);

    expect(respuesta.status).toBe(500);
    expect((await respuesta.json()).error).toBe("msg: bd caída");
    expect(m.after).not.toHaveBeenCalled();
  });
});

describe("POST ?reintentar: reprocesar sin volver a tomar la foto", () => {
  const urlReintento = "http://x/captura-orden/ov-1/api?ot=pedido%3A1%7Calmacen%3Aa&reintentar=id-1";
  const reintento = () => new Request(urlReintento, { method: "POST", headers: { accept: "application/json" } });
  const fallido = (extra = {}) => ({
    ref: REF,
    intento: { idIntento: "id-1", estado: "fallo", urlFoto: "https://foto/1.jpg", numeroIntento: 1, ...extra },
  });

  it("reprocesa la foto guardada con un número de intento más", async () => {
    const { POST } = await ruta();
    m.cargarIntento.mockResolvedValue(fallido());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(new Uint8Array([9, 9]), { headers: { "content-type": "image/jpeg" } })),
    );

    const respuesta = await POST(reintento(), CONTEXTO);

    expect(respuesta.status).toBe(202);
    expect(await respuesta.json()).toMatchObject({ idIntento: "id-1", numeroIntento: 2 });
    expect(m.prepararReintento).toHaveBeenCalledWith(REF, 2);

    await (m.after.mock.calls[0]![0] as () => Promise<void>)();
    expect(m.procesarIntento).toHaveBeenCalledWith(
      REF,
      expect.objectContaining({ urlFotoGuardada: "https://foto/1.jpg", mime: "image/jpeg" }),
    );
  });

  it("no reintenta una foto que sigue en proceso o que ya quedó lista", async () => {
    const { POST } = await ruta();

    m.cargarIntento.mockResolvedValue(fallido({ estado: "procesando" }));
    expect((await POST(reintento(), CONTEXTO)).status).toBe(409);

    m.cargarIntento.mockResolvedValue(fallido({ estado: "lista" }));
    const respuesta = await POST(reintento(), CONTEXTO);
    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).error).toMatch(/ya se procesó/i);
    expect(m.prepararReintento).not.toHaveBeenCalled();
  });

  it("si la foto nunca se guardó pide tomarla de nuevo", async () => {
    const { POST } = await ruta();
    m.cargarIntento.mockResolvedValue(fallido({ urlFoto: null }));

    const respuesta = await POST(reintento(), CONTEXTO);

    expect(respuesta.status).toBe(409);
    expect(await respuesta.json()).toMatchObject({ codigo: "sin_foto" });
  });

  it("si ya no se puede descargar la foto guardada, tampoco reintenta", async () => {
    const { POST } = await ruta();
    m.cargarIntento.mockResolvedValue(fallido());
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no", { status: 404 })));

    expect((await POST(reintento(), CONTEXTO)).status).toBe(409);
    expect(m.prepararReintento).not.toHaveBeenCalled();
  });

  it("un intento que no es de esta OV responde 404", async () => {
    const { POST } = await ruta();
    m.cargarIntento.mockResolvedValue(null);

    expect((await POST(reintento(), CONTEXTO)).status).toBe(404);
  });
});

describe("GET ?intentos: estado de cada foto", () => {
  it("devuelve el estado de los ids pedidos, sin guardarlo en caché", async () => {
    const { GET } = await ruta();
    m.leerIntentos.mockResolvedValue([{ idIntento: "id-1", estado: "lista" }]);

    const respuesta = await GET(
      new Request("http://x/captura-orden/ov-1/api?intentos=id-1,%20id-2,,"),
      CONTEXTO,
    );

    expect(await respuesta.json()).toEqual({ intentos: [{ idIntento: "id-1", estado: "lista" }] });
    expect(respuesta.headers.get("Cache-Control")).toBe("no-store");
    expect(m.leerIntentos).toHaveBeenCalledWith({
      ids: ["id-1", "id-2"],
      idOrdenVenta: "ov-1",
      codigoCuenta: "1YW43",
    });
  });

  it("consultar el estado repetidas veces no vuelve a buscar la OV", async () => {
    const { GET } = await ruta();
    m.leerIntentos.mockResolvedValue([]);

    await GET(new Request("http://x/a?intentos=a"), CONTEXTO);
    await GET(new Request("http://x/a?intentos=b"), CONTEXTO);

    expect(m.meta).toHaveBeenCalledTimes(1);
  });

  it("sin ?intentos cae a las lecturas de siempre (captura, historial)", async () => {
    const { GET } = await ruta();
    m.lectura.mockResolvedValue(Response.json({ tieneCaptura: false }));

    const respuesta = await GET(new Request("http://x/a?all=1"), CONTEXTO);

    expect(await respuesta.json()).toEqual({ tieneCaptura: false });
    expect(m.lectura).toHaveBeenCalled();
    expect(m.leerIntentos).not.toHaveBeenCalled();
  });

  it("una orden inexistente responde 404", async () => {
    const { GET } = await ruta();
    m.meta.mockResolvedValue(null);

    expect((await GET(new Request("http://x/a?intentos=a"), CONTEXTO)).status).toBe(404);
  });
});
