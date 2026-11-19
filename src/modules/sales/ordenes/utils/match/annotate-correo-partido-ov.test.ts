import { describe, expect, it } from "vitest";
import {
  annotateCorreoPartidoOv,
  claveEnvioDesdeOrigenArchivos,
  tooltipCorreoPartidoListado,
} from "./annotate-correo-partido-ov";

const PATH =
  '[{"nombre":"a.pdf","path":"1YW43/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee-a.pdf"}]';
const PATH_B =
  '[{"nombre":"b.pdf","path":"1YW43/11111111-2222-3333-4444-555555555555-b.pdf"}]';

describe("annotateCorreoPartidoOv (REQ-338)", () => {
  it("sin uuid en ruta no marca nada", () => {
    const map = annotateCorreoPartidoOv([
      {
        idOrdenVenta: "a",
        codigo: "OV-1",
        origenArchivos: "solo-nombre.pdf",
      },
      {
        idOrdenVenta: "b",
        codigo: "OV-2",
        origenArchivos: "otro.pdf",
      },
    ]);
    expect(map.get("a")?.correoPartido).toBe(false);
    expect(claveEnvioDesdeOrigenArchivos("a.pdf")).toBeNull();
  });

  it("dos OV con el mismo path de envío se marcan y listan la otra", () => {
    const map = annotateCorreoPartidoOv([
      { idOrdenVenta: "a", codigo: "OV-00001882", origenArchivos: PATH },
      { idOrdenVenta: "b", codigo: "OV-00001883", origenArchivos: PATH },
      { idOrdenVenta: "c", codigo: "OV-00001900", origenArchivos: PATH_B },
    ]);
    expect(map.get("a")?.correoPartido).toBe(true);
    expect(map.get("a")?.correoPartidoDe).toEqual(["OV-00001883"]);
    expect(map.get("b")?.correoPartidoDe).toEqual(["OV-00001882"]);
    expect(map.get("c")?.correoPartido).toBe(false);
  });

  it("ignora canceladas al agrupar", () => {
    const map = annotateCorreoPartidoOv([
      { idOrdenVenta: "a", codigo: "OV-1", origenArchivos: PATH },
      {
        idOrdenVenta: "b",
        codigo: "OV-2",
        origenArchivos: PATH,
        estado: "cancelada",
      },
    ]);
    expect(map.get("a")?.correoPartido).toBe(false);
  });
});

describe("tooltipCorreoPartidoListado (REQ-338)", () => {
  it("nombra el total y las otras OV", () => {
    expect(
      tooltipCorreoPartidoListado({
        totalHermanas: 3,
        otrasCodigos: ["OV-00001883", "OV-00001884"],
      }),
    ).toBe(
      "Este correo se partió en 3 OV, una por orden de compra. Las otras: OV-00001883, OV-00001884.",
    );
  });
});
