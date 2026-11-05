import { beforeEach, describe, expect, it, vi } from "vitest";
import { responderLectura } from "./captura-lecturas";

const servicio = vi.hoisted(() => ({
  getOrdenSurtidoCaptura: vi.fn(),
  listOrdenSurtidoCapturaFotos: vi.fn(),
  listOrdenSurtidoCapturaOtsConFotos: vi.fn(),
  listOrdenSurtidoCapturas: vi.fn(),
}));

vi.mock("@/modules/sales/ordenes/surtido/orden-surtido.service", () => servicio);

const META = { idOrdenVenta: "ov-1", folio: "OV-00001" };

function leer(consulta: string, idOrdenTrabajo = "") {
  return responderLectura({
    meta: META,
    idOrdenVenta: "ov-1",
    idOrdenTrabajo,
    searchParams: new URLSearchParams(consulta),
  }).then((r) => r.json() as Promise<Record<string, unknown>>);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("responderLectura", () => {
  it("sin parámetros devuelve la captura actual de la OT", async () => {
    servicio.getOrdenSurtidoCaptura.mockResolvedValue({
      idOrdenTrabajo: "ot-1",
      payload: { precisionEstimada: 80 },
      urlFoto: "https://foto/1.jpg",
      modelo: "gpt-4o",
      updatedAt: "2026-11-04T10:00:00Z",
    });

    const datos = await leer("", "ot-1");

    expect(datos).toMatchObject({
      folio: "OV-00001",
      tieneCaptura: true,
      captura: { precisionEstimada: 80, modelo: "gpt-4o" },
    });
  });

  it("sin captura devuelve tieneCaptura en falso", async () => {
    servicio.getOrdenSurtidoCaptura.mockResolvedValue(null);

    await expect(leer("")).resolves.toMatchObject({ tieneCaptura: false, captura: null });
  });

  it("?all=1 lista las capturas de todas las OT", async () => {
    servicio.listOrdenSurtidoCapturas.mockResolvedValue([
      { idOrdenTrabajo: "a", payload: {}, urlFoto: null, modelo: "m", updatedAt: "t" },
    ]);

    const datos = await leer("all=1");

    expect(datos).toMatchObject({ tieneCaptura: true });
    expect(datos.capturas).toHaveLength(1);
  });

  it("?historial=1 con una OT lista las fotos de esa OT", async () => {
    servicio.listOrdenSurtidoCapturaFotos.mockResolvedValue([
      { idFoto: "f1", idOrdenTrabajo: "ot-1", urlFoto: "https://foto/1.jpg", createdAt: "t" },
    ]);

    const datos = await leer("historial=true&ot=ot-1", "ot-1");

    expect(servicio.listOrdenSurtidoCapturaFotos).toHaveBeenCalledWith("ov-1", "ot-1");
    expect(datos.fotos).toHaveLength(1);
  });

  it("?historial=1 sin OT lista las OT que tienen fotos", async () => {
    servicio.listOrdenSurtidoCapturaOtsConFotos.mockResolvedValue([
      { idOrdenTrabajo: "ot-1", totalFotos: 2, ultimaAt: "t", previewUrl: null, label: "OT 1", numeroPedido: "1", centroConsumo: "c" },
    ]);

    const datos = await leer("historial=1");

    expect(datos.ordenesTrabajo).toHaveLength(1);
    expect(servicio.listOrdenSurtidoCapturaFotos).not.toHaveBeenCalled();
  });
});
