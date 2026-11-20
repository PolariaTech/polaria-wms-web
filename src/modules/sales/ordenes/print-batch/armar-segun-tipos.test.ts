import { jsPDF } from "jspdf";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow, OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { EmpresaPrefactura } from "./cargar-empresa-prefactura";
import { armarSegunTipos, type EntradaSegunTipos } from "./armar-segun-tipos";
import type { TipoDocumentoRapida } from "./ImpresionRapidaTipos";

const cargarHojas = vi.fn();
const armarPrevia = vi.fn();

vi.mock("./cargar-hojas-batch", () => ({
  cargarHojasBatch: (...args: unknown[]) => cargarHojas(...args),
}));
vi.mock("./armar-previa-rapida", () => ({
  armarPreviaRapida: (...args: unknown[]) => armarPrevia(...args),
}));
vi.mock("./armar-parte-pdf", async () => {
  const { jsPDF: Pdf } = await import("jspdf");
  return {
    armarPartePdf: async () => {
      const doc = new Pdf({ unit: "mm", format: "letter" });
      doc.text("parte", 10, 10);
      return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
    },
  };
});

const empresa: EmpresaPrefactura = {
  razonSocial: "Aguacates de puebla",
  rfc: "APU210325668",
  regimenFiscal: "601",
  codigoPostalExpedicion: "77560",
  nombreCuentaBancaria: "Aguacates de Puebla",
  banco: "BBVA",
  clabe: "1",
  correoCobranza: "cobranza@aguacatesdepuebla.com",
  serieFactura: "CS-",
  logo: null,
};

function detalle(): OrdenVentaDetalleRow {
  return {
    codigo: "OV-a",
    fecha_pedido: "2026-11-18",
    comprador_razon_social: "Hotel Sol",
    lineas: [
      {
        id_linea_orden_venta: "l1",
        id_producto: "p1",
        cantidad_pedida: 1,
        precio_unitario: 10,
        producto: { sku: "AGU", descripcion: "Aguacate", metadatos_catalogo: null },
      },
    ],
  } as OrdenVentaDetalleRow;
}

function entrada(tipos: TipoDocumentoRapida[]): EntradaSegunTipos {
  return {
    tipos: new Set(tipos),
    codigoCuenta: "JBR",
    fecha: "2026-11-18",
    zonaHoraria: "America/Cancun",
    resumen: [{ row: { idOrdenVenta: "a", venta: "OV-a" } as OrdenVentaOperadorRow, ots: [1] }],
    runScoped: (tarea) => tarea(),
    alProgreso: vi.fn(),
    codigoEmpresa: "Y9IHZ",
    leerEmpresa: async () => empresa,
    leerDetalle: async () => detalle(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  cargarHojas.mockResolvedValue([{ idOrdenVenta: "a" }]);
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  doc.text("ot", 10, 10);
  const blob = new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
  const resumen = entrada(["ot"]).resumen;
  armarPrevia.mockResolvedValue({
    blob,
    hojas: [{ idOrdenVenta: "a" }],
    resumen,
    nombreArchivo: "x.pdf",
    partes: [{ hojas: [], resumen }],
  });
});

describe("armarSegunTipos", () => {
  it("sin prefactura arma solo las hojas, como hasta ahora", async () => {
    const previa = await armarSegunTipos(entrada(["ot"]));

    expect(cargarHojas).toHaveBeenCalledTimes(1);
    expect(armarPrevia).toHaveBeenCalledTimes(1);
    expect(previa.prefacturas).toBeUndefined();
  });

  it("solo prefacturas no pide hojas de orden de tarea", async () => {
    const previa = await armarSegunTipos(entrada(["factura"]));

    expect(cargarHojas).not.toHaveBeenCalled();
    expect(previa.hojas).toHaveLength(0);
    expect(previa.partes?.[0]?.pdf).toBeInstanceOf(Blob);
  });

  it("con órdenes de tarea y prefactura conserva las hojas y anexa el PDF", async () => {
    const previa = await armarSegunTipos(entrada(["ot", "factura"]));

    expect(previa.hojas).toHaveLength(1);
    expect(previa.partes?.[0]?.pdf).toBeInstanceOf(Blob);
    expect(previa.resumenPdf).toBeUndefined();
  });

  it("sin hojas de OT no arma un paquete vacío", async () => {
    cargarHojas.mockResolvedValue([]);

    await expect(armarSegunTipos(entrada(["ot"]))).rejects.toThrow("No hay hojas para las OT de estas órdenes.");
  });
});
