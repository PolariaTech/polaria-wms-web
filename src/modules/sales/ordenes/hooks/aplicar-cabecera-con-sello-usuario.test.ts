import { describe, expect, it } from "vitest";
import {
  notasCanonConSelloUsuario,
  resolverCabeceraFormConSelloUsuario,
} from "./aplicar-cabecera-con-sello-usuario";
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

describe("notasCanonConSelloUsuario (REQ-281)", () => {
  it("sin sello puede re-extraer; con sello vacío queda vacío", () => {
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
});
