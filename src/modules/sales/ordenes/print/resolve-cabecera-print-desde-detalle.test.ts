import { describe, expect, it } from "vitest";
import {
  resolveCentroConsumoDesdeDetalle,
  resolveFechaYDiaEntregaDesdeDetalle,
  resolveNotasGeneralesDesdeDetalle,
} from "./resolve-cabecera-print-desde-detalle";

describe("resolve-cabecera-print-desde-detalle (REQ-281 / REQ-032 PDF)", () => {
  it("notas vacías en BD no reinyectan el correo", () => {
    expect(resolveNotasGeneralesDesdeDetalle("")).toBe("");
    expect(resolveNotasGeneralesDesdeDetalle("   ")).toBe("");
  });

  it("notas de almacén del detalle mandan sin sello", () => {
    expect(
      resolveNotasGeneralesDesdeDetalle("Traer solo dos facturas con la OC"),
    ).toMatch(/dos facturas/i);
  });

  it("REQ-032: con sello manda el texto del form aunque notas_almacen traiga el correo", () => {
    const editadas =
      "que su chofer traiga la OC impresa al momento de la entrega junto con su factura fiscal. Por favor traer únicamente dos facturas junto con la orden de compra";
    const correoViejo =
      "Adjunto le remito la orden de compra. En caso de haber faltantes, favor de mencionar. También verificar la fecha de entrega indicada en la OC.  Le recuerdo que";
    const origenConSello = [
      {
        Producto: "TOMATE",
        Cantidad: 1,
        _cabeceraUsuario: {
          notasGenerales: editadas,
          centroConsumo: "",
          referenciaPedido: "",
          fechaEntrega: "",
          direccionEntrega: "",
          contacto: "",
          telefono: "",
          correo: "",
        },
      },
    ];
    const pdf = resolveNotasGeneralesDesdeDetalle(correoViejo, origenConSello);
    expect(pdf).toMatch(/dos facturas/i);
    expect(pdf).not.toMatch(/Adjunto le remito/i);
    expect(pdf).not.toMatch(/faltantes/i);
  });

  it("REQ-032: sello con notas vacías no reinyecta notas_almacen del correo", () => {
    const origenConSelloVacio = [
      {
        Producto: "TOMATE",
        Cantidad: 1,
        _cabeceraUsuario: {
          notasGenerales: "",
          centroConsumo: "",
          referenciaPedido: "",
          fechaEntrega: "",
          direccionEntrega: "",
          contacto: "",
          telefono: "",
          correo: "",
        },
      },
    ];
    expect(
      resolveNotasGeneralesDesdeDetalle(
        "Adjunto le remito la orden de compra.",
        origenConSelloVacio,
      ),
    ).toBe("");
  });

  it("centro vacío en BD no cae a Almacen de Mateo", () => {
    expect(
      resolveCentroConsumoDesdeDetalle({
        centroBd: "",
        centroCaptura: "",
      }),
    ).toBe("");
  });

  it("centro BD gana sobre captura", () => {
    expect(
      resolveCentroConsumoDesdeDetalle({
        centroBd: "Bar limpio",
        centroCaptura: "Cocina Mateo",
      }),
    ).toBe("Bar limpio");
  });

  it("fecha BD gana; sin Fecha de OT", () => {
    const conBd = resolveFechaYDiaEntregaDesdeDetalle({
      fechaCaptura: "2026-01-01",
      fechaEntregaBd: "2026-09-03T00:00:00.000Z",
      fechaPedido: "2026-06-28T12:00:00.000Z",
      createdAt: "2026-06-28T12:00:00.000Z",
    });
    expect(conBd.fechaEntrega).toBe("03/09/2026");

    const vacia = resolveFechaYDiaEntregaDesdeDetalle({
      fechaCaptura: "",
      fechaEntregaBd: "",
      fechaPedido: null,
      createdAt: null,
    });
    expect(vacia.fechaEntrega).toBe("");
  });
});
