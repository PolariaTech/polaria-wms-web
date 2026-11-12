import { describe, expect, it } from "vitest";
import {
  notasCanonConSelloUsuario,
  resolverCabeceraFormConSelloUsuario,
} from "./aplicar-cabecera-con-sello-usuario";
import { resolveCabeceraGuardada } from "../utils/pedido/resolve-cabecera-guardada";
import { sellarCabeceraUsuarioEnOrigen } from "../utils/pedido/sellar-edicion-usuario-origen";

describe("resolverCabeceraFormConSelloUsuario (REQ-281)", () => {
  it("con sello vacío no vuelve el texto de Mateo en notas ni teléfono", () => {
    const filas = sellarCabeceraUsuarioEnOrigen(
      [{ Producto: "Aguacate", Cantidad: 1, Almacen: "SUSHI" }],
      {
        notasGenerales: "",
        centroConsumo: "",
        referenciaPedido: "",
        fechaEntrega: "2026-11-06",
        direccionEntrega: "",
        contacto: "",
        telefono: "",
        correo: "",
      },
    );
    const out = resolverCabeceraFormConSelloUsuario({
      origenCorreoRows: filas,
      detalle: {
        notas_almacen: null,
        centro_consumo: null,
        telefono_contacto: null,
        fecha_entrega: "2026-11-06",
        observaciones: "Fecha entrega: 2026-11-06",
      },
      mapped: {
        centroConsumo: "SUSHI CENTRAL",
        observaciones: "PEDIDO ADP — Emisión 18:10",
        ordenCompraHotel: "ADP-1",
        direccion: "Av Bonampak",
        anden: "",
        contacto: "AXEL",
        telefono: "9617995980",
        correo: "a@b.com",
        fechaEntrega: "2026-11-06",
      },
      hijasEdit: [
        {
          id: "ot-1",
          label: "1",
          numeroPedido: "ADP-1",
          almacen: "SUSHI",
          referenciaPedido: "",
          fecha: "2026-11-06",
          responsableExterno: "AXEL",
          renglones: filas,
          totalCantidad: 1,
        },
      ],
      telefonoForMap: "9999999999",
    });
    expect(out.observaciones).toBe("");
    expect(out.centroConsumo).toBe("");
    expect(out.telefono).toBe("");
    expect(out.contacto).toBe("");
    expect(out.direccion).toBe("");
  });
});

describe("notasCanonConSelloUsuario (REQ-281 / REQ-141)", () => {
  it("con sello vacío queda vacío", () => {
    const conSello = sellarCabeceraUsuarioEnOrigen(
      [{ Producto: "X", Cantidad: 1 }],
      {
        notasGenerales: "",
        centroConsumo: "A",
        referenciaPedido: "",
        fechaEntrega: "",
        direccionEntrega: "",
        contacto: "",
        telefono: "",
        correo: "",
      },
    );
    expect(
      notasCanonConSelloUsuario({
        origenCorreoRows: conSello,
        notasAlmacen: "",
        observacionesOv: "",
        origenTexto: "Maduro · andén 3",
      }),
    ).toBe("");
  });

  it("REQ-141: sin sello, notas_almacen vacío + captura no reinyecta el correo", () => {
    expect(
      notasCanonConSelloUsuario({
        origenCorreoRows: [
          {
            Producto: "X",
            Cantidad: 1,
            "Notas generales": "Adjunto le remito la orden",
          },
        ],
        notasAlmacen: "",
        observacionesOv: "Fecha de entrega: 2026-10-30",
        origenTexto:
          "Adjunto le remito la orden de compra. En caso de haber faltantes, favor de mencionar.",
      }),
    ).toBe("");
  });

  it("REQ-141: resolveCabeceraGuardada no revive notas si notas_almacen vacío con captura", () => {
    expect(
      resolveCabeceraGuardada({
        detalle: {
          orden_compra_hotel: "OCC-1",
          notas_almacen: "",
          observaciones: "Fecha entrega: 2026-10-30",
          origen_texto: "Adjunto le remito la orden de compra.",
        },
        filasOrigen: [
          { "Notas generales": "" },
          { "Notas generales": "Adjunto le remito la orden" },
        ],
        propuesta: {
          observaciones: "Adjunto le remito la orden de compra.",
          ordenCompraHotel: "OCC-1",
        },
      }).observaciones,
    ).toBe("");
  });
});
