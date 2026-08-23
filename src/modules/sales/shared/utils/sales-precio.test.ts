import { describe, expect, it } from "vitest";
import {
  mapLatestPrecioProductoById,
  parsePrecioProducto,
  resolvePrecioUnitarioFromMetadatos,
} from "./sales-precio";

describe("resolvePrecioUnitarioFromMetadatos", () => {
  it("lee precio desde metadatos_catalogo", () => {
    expect(resolvePrecioUnitarioFromMetadatos({ precio: "12000" })).toBe(12000);
    expect(resolvePrecioUnitarioFromMetadatos({ precio: "15,5" })).toBe(15.5);
  });

  it("devuelve 0 si no hay precio", () => {
    expect(resolvePrecioUnitarioFromMetadatos(null)).toBe(0);
    expect(resolvePrecioUnitarioFromMetadatos({})).toBe(0);
  });
});

describe("mapLatestPrecioProductoById", () => {
  it("parsea numeric y string", () => {
    expect(parsePrecioProducto("106.5700")).toBe(106.57);
    expect(parsePrecioProducto(88.88)).toBe(88.88);
    expect(parsePrecioProducto(null)).toBe(0);
  });

  it("toma la primera fila de cada producto (más reciente)", () => {
    const precios = mapLatestPrecioProductoById([
      {
        id_producto: "prod-1",
        precio: "106.5700",
        fecha_aplicacion: "2026-07-11T00:38:27.036Z",
      },
      {
        id_producto: "prod-1",
        precio: "90.0000",
        fecha_aplicacion: "2026-01-01T00:00:00.000Z",
      },
      {
        id_producto: "prod-2",
        precio: "109.76",
        fecha_aplicacion: "2026-07-11T00:38:27.036Z",
      },
    ]);

    expect(precios.get("prod-1")).toBe(106.57);
    expect(precios.get("prod-2")).toBe(109.76);
  });
});
