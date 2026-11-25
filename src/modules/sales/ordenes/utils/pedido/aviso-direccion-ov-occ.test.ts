import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import {
  applyOcPorAlmacenAOrdenesTrabajo,
  applyOcSinMapaAOrdenesTrabajo,
  extractOcAdjuntoPaths,
  matchAlmacenEnMapaOc,
} from "./aviso-direccion-ov-occ";

function makeHija(overrides: Partial<OrdenTrabajoHija>): OrdenTrabajoHija {
  return {
    id: "ot-1",
    label: "Cocina Central",
    numeroPedido: "",
    almacen: "Cocina Central",
    referenciaPedido: "",
    fecha: "2026-10-20",
    responsableExterno: "",
    renglones: [{ Producto: "Limón", Cantidad: 5, "Numero pedido": "" }],
    totalCantidad: 5,
    ...overrides,
  };
}

describe("aviso-direccion-ov-occ", () => {
  it("extrae rutas únicas solo de adjuntos .eml, .pdf o mime message", () => {
    const paths = extractOcAdjuntoPaths([
      { nombre: "pedido.PDF", path: "  /tmp/a.pdf ", mime: "application/pdf" },
      { nombre: "correo.eml", path: "/tmp/b.eml", mime: "" },
      { nombre: "duplicado.pdf", path: "/tmp/a.pdf", mime: "application/pdf" },
      { nombre: "sin-ext", path: "/tmp/c.msg", mime: "message/rfc822" },
      { nombre: "imagen.png", path: "/tmp/d.png", mime: "image/png" },
      { nombre: "vacio.pdf", path: "   ", mime: "application/pdf" },
    ]);
    expect(paths).toEqual(["/tmp/a.pdf", "/tmp/b.eml", "/tmp/c.msg"]);
  });

  it("aplica OCC sin mapa a hijas vacías o con basura, respetando las válidas", () => {
    const hijas = [
      makeHija({ id: "ot-1", numeroPedido: "rAutorizado", almacen: "Cocina A" }),
      makeHija({ id: "ot-2", numeroPedido: "4501056534", almacen: "Cocina B" }),
    ];
    const { next, changed } = applyOcSinMapaAOrdenesTrabajo(hijas, "4509998888");
    expect(changed).toBe(true);
    expect(next[0]?.numeroPedido).toBe("4509998888");
    expect(next[0]?.label).toBe("4509998888 — Cocina A");
    expect(next[0]?.renglones[0]?.["Numero pedido"]).toBe("4509998888");
    expect(next[1]?.numeroPedido).toBe("4501056534");
  });

  it("empareja almacén por inclusión y por código corto de 5 caracteres", () => {
    const mapa = {
      "CBEEFE BEEF BAR": "50179",
      "COCINA PRINCIPAL": "50180",
    };
    expect(matchAlmacenEnMapaOc("CBEEFB", mapa)).toBe("50179");
    expect(matchAlmacenEnMapaOc("Cocina Principal Hotel", mapa)).toBe("50180");
    expect(matchAlmacenEnMapaOc("Almacen Desconocido", mapa)).toBe("");
  });

  it("aplica OCC por almacén sin sobrescribir pedidos ya válidos", () => {
    const hijas = [
      makeHija({ id: "ot-1", numeroPedido: "", almacen: "CBEEFB" }),
      makeHija({ id: "ot-2", numeroPedido: "50999", almacen: "COCINA PRINCIPAL" }),
    ];
    const { next, changed } = applyOcPorAlmacenAOrdenesTrabajo(hijas, {
      "CBEEFE BEEF BAR": "50179",
      "COCINA PRINCIPAL": "50180",
    });
    expect(changed).toBe(true);
    expect(next[0]?.numeroPedido).toBe("50179");
    expect(next[0]?.label).toBe("50179 — CBEEFB");
    expect(next[1]?.numeroPedido).toBe("50999");
  });
});
