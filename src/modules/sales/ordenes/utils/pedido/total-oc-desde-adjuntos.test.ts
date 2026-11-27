import { afterEach, describe, expect, it, vi } from "vitest";
import {
  leerTotalOcDesdeAdjuntos,
  rutasAdjuntosConTotal,
  totalSolicitudDeLaOv,
} from "./total-oc-desde-adjuntos";

/** Correo de OV-00003000 / OV-00003001: dos OC en el mismo .eml. */
const DOS_OC = {
  totalSolicitud: 27325.35,
  totalesPorOc: { "4503007904": 27325.35, "4503007927": 22671.75 },
};

describe("totalSolicitudDeLaOv", () => {
  it("REQ-425: con varias OC toma la de esta OV, no la primera del correo", () => {
    expect(totalSolicitudDeLaOv(DOS_OC, ["4503007927"])).toBe(22671.75);
    expect(totalSolicitudDeLaOv(DOS_OC, ["4503007904"])).toBe(27325.35);
  });

  it("si la OV junta varias OC suma sus totales", () => {
    expect(totalSolicitudDeLaOv(DOS_OC, ["4503007904", "OC 4503007927"])).toBe(49997.1);
  });

  it("varias OC y ninguna es de la OV: sin total (sería de otra OV)", () => {
    expect(totalSolicitudDeLaOv(DOS_OC, ["999"])).toBeNull();
    expect(totalSolicitudDeLaOv(DOS_OC, [])).toBeNull();
  });

  it("una sola OC o sin desglose: usa el total del adjunto", () => {
    expect(totalSolicitudDeLaOv({ totalSolicitud: 1234.5 }, ["450"])).toBe(1234.5);
    expect(
      totalSolicitudDeLaOv({ totalSolicitud: 80, totalesPorOc: { "111": 80 } }, ["222"]),
    ).toBe(80);
    expect(totalSolicitudDeLaOv({ totalSolicitud: 0 }, [])).toBeNull();
  });
});

describe("rutasAdjuntosConTotal", () => {
  it("solo PDF y EML con ruta, sin repetir", () => {
    expect(
      rutasAdjuntosConTotal([
        { nombre: "correo.eml", path: "c/correo.eml", mime: "message/rfc822" },
        { nombre: "oc.pdf", path: "c/oc.pdf" },
        { nombre: "oc.pdf", path: "c/oc.pdf" },
        { nombre: "foto.jpg", path: "c/foto.jpg", mime: "image/jpeg" },
        { nombre: "sin-ruta.pdf" },
      ]),
    ).toEqual(["c/correo.eml", "c/oc.pdf"]);
  });
});

describe("leerTotalOcDesdeAdjuntos", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("salta el adjunto que falla y devuelve el total de la OC de la OV", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: async () => DOS_OC });
    vi.stubGlobal("fetch", fetchMock);

    const total = await leerTotalOcDesdeAdjuntos({
      rutas: ["c/roto.pdf", "c/correo.eml"],
      ocsOv: ["4503007927"],
      cancelado: () => false,
    });

    expect(total).toBe(22671.75);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("cancelado no devuelve total", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => DOS_OC }));

    const total = await leerTotalOcDesdeAdjuntos({
      rutas: ["c/correo.eml"],
      ocsOv: ["4503007927"],
      cancelado: () => true,
    });

    expect(total).toBeNull();
  });

  it("si fetch lanza, sigue y termina sin total", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("red")));

    const total = await leerTotalOcDesdeAdjuntos({
      rutas: ["c/oc.pdf"],
      ocsOv: [],
      cancelado: () => false,
    });

    expect(total).toBeNull();
  });
});
