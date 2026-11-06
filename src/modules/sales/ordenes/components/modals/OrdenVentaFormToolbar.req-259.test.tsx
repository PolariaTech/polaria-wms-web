import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";
import { OrdenVentaFormStep } from "./OrdenVentaFormToolbar";

function estadoConRfc(parcial: Record<string, unknown> = {}) {
  const datos: Record<string, unknown> = {
    isEditing: false,
    hijaFormActiva: null,
    ordenesTrabajoForm: [],
    afterCutoff: false,
    successMessage: null,
    hasProductos: true,
    emptyCatalogMessage: "",
    startMode: "scratch",
    origenTexto: "",
    origenArchivosNombres: [],
    idComprador: "c1",
    compradorLabel: "Cliente",
    compradorNombreIa: null,
    compradorSugerencias: [],
    missingFields: new Set(),
    autoFields: new Set(),
    warnFields: new Set(),
    codigoClienteCatalogo: "105",
    denominacionComercialCatalogo: "SLS",
    denominacionComercial: "SLS",
    setDenominacionComercial: vi.fn(),
    compradores: [
      {
        idComprador: "c1",
        codigo: "105",
        apodo: "SLS",
        denominacionComercialOverride: "",
        rfc: "CPM850101ABC",
      },
    ],
    fichaComprador: null,
    ordenCompraHotel: "",
    exigeOc: false,
    centroConsumo: "",
    fechaEntrega: "2099-01-15",
    esPorConfirmar: true,
    ventanaDesde: "",
    ventanaHasta: "",
    prioridad: "Normal",
    moneda: "MXN",
    observaciones: "",
    direccion: "",
    avisoVerificarDireccion: false,
    contacto: "",
    telefono: "",
    correo: "",
    lineasConIndice: [],
    lineas: [],
    subtotalVenta: 0,
    ivaVenta: 0,
    totalVenta: 0,
    totalOvCompleta: 0,
    mostrarTotalOv: false,
    puedeAgregarProducto: true,
    aceptaSustituciones: "",
    requiereLote: "",
    registrarTemperatura: "",
    setStep: vi.fn(),
    setStartMode: vi.fn(),
    setError: vi.fn(),
    setPicker: vi.fn(),
    ...parcial,
  };
  return new Proxy(datos, {
    get: (destino, clave: string) =>
      clave in destino ? destino[clave] : vi.fn(),
  }) as unknown as OrdenVentaFormEstado;
}

describe("OrdenVentaFormStep REQ-259", () => {
  it("muestra el RFC del comprador en Datos del pedido", () => {
    render(<OrdenVentaFormStep {...estadoConRfc()} />);
    const rfc = screen.getByLabelText(/^RFC$/) as HTMLInputElement;
    expect(rfc).toHaveAttribute("readonly");
    expect(rfc.value).toBe("CPM850101ABC");
  });
});
