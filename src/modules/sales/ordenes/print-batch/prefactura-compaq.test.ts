import { describe, expect, it, vi } from "vitest";
import {
  armarCuerpoPrefacturaCompaq,
  enviarPrefacturaCompaq,
  MENSAJE_OV_CODIGO_ANTIGUO,
  mensajeFacturado,
  referenciaPrefactura,
  type DatosPrefacturaCompaq,
} from "./prefactura-compaq";

const datos: DatosPrefacturaCompaq = {
  fechaPedido: "2026-11-17",
  codigoCliente: "1052000407",
  codigoOv: "OV-00000049",
  ot: "pedido:4501110118|almacen:puebla xo01 xoximilco (consumo interno)",
  renglones: [
    {
      "Numero pedido": "4501110118",
      Almacen: "PUEBLA XO01 XOXIMILCO (Consumo Interno)",
      Producto: "AGUACATE JASS",
      "Codigo producto": "X200011700",
      Cantidad: 3,
      Precio: 67,
    },
  ],
  lineas: [{ textoCliente: "AGUACATE JASS", sku: "115001009", cantidad: 3 }],
};

describe("armarCuerpoPrefacturaCompaq", () => {
  it("arma el JSON de Compaq con la bodega de la orden", () => {
    const armado = armarCuerpoPrefacturaCompaq(datos);
    expect(armado).toEqual({
      ok: true,
      cuerpo: {
        fecha: "2026-11-17",
        cliente: "1052000407",
        referencia: "OV-00000049AFBEAF",
        partidas: [{ sku: "115001009", bodega: "8", cantidad: 3, precio: 67 }],
      },
    });
  });

  it("rechaza una partida sin código de producto", () => {
    const armado = armarCuerpoPrefacturaCompaq({
      ...datos,
      renglones: [{ ...datos.renglones[0], Producto: "", "Codigo producto": "" }],
      lineas: [],
    });
    expect(armado).toEqual({
      ok: false,
      error: "Una partida no tiene código de producto.",
    });
  });
});

describe("referenciaPrefactura", () => {
  it("pega el código corto de la orden con la huella de la hoja", () => {
    expect(referenciaPrefactura(datos.codigoOv, datos.ot)).toEqual({
      ok: true,
      referencia: "OV-00000049AFBEAF",
    });
  });

  it("cambia la huella cuando la hoja es otra", () => {
    const cocina = referenciaPrefactura("OV-00000049", "pedido:1|almacen:cocina");
    const hacienda = referenciaPrefactura("OV-00000049", "pedido:1|almacen:hacienda");
    expect(cocina).toEqual({ ok: true, referencia: "OV-0000004914E3C0" });
    expect(hacienda).toEqual({ ok: true, referencia: "OV-0000004941004A" });
  });

  it("rechaza el código largo antiguo", () => {
    expect(referenciaPrefactura("OV-20261002-102831", datos.ot)).toEqual({
      ok: false,
      error: MENSAJE_OV_CODIGO_ANTIGUO,
    });
  });
});

describe("enviarPrefacturaCompaq", () => {
  it("toma el folio cuando Compaq crea la prefactura", async () => {
    vi.stubEnv("COMPAC_PREFACTURA_URL", "http://compaq.test/prefactura");
    const pedir = vi.fn(async () =>
      Response.json(
        { ok: true, documento: 1, folio: 18, serie: "CS-", referencia: "4501110118", total: 201 },
        { status: 201 },
      ),
    );
    const armado = armarCuerpoPrefacturaCompaq(datos);
    if (!armado.ok) throw new Error(armado.error);
    const resultado = await enviarPrefacturaCompaq(armado.cuerpo, pedir);
    expect(resultado.ok).toBe(true);
    expect(mensajeFacturado(resultado)).toBe("Facturado. Folio CS-18.");
    vi.unstubAllEnvs();
  });

  it("acepta la referencia duplicada como la prefactura ya creada", async () => {
    vi.stubEnv("COMPAC_PREFACTURA_URL", "http://compaq.test/prefactura");
    const pedir = vi.fn(async () =>
      Response.json(
        {
          ok: false,
          codigo: "REFERENCIA_DUPLICADA",
          error: "Esa referencia ya creó un documento.",
          folio: 18,
          serie: "CS-",
        },
        { status: 409 },
      ),
    );
    const armado = armarCuerpoPrefacturaCompaq(datos);
    if (!armado.ok) throw new Error(armado.error);
    const resultado = await enviarPrefacturaCompaq(armado.cuerpo, pedir);
    expect(resultado.ok).toBe(true);
    expect(resultado.folio).toBe(18);
    vi.unstubAllEnvs();
  });
});
