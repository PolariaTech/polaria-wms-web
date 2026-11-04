import { describe, expect, it, vi } from "vitest";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import { validarEnvioOv } from "./validar-envio-ov";

function linea(partial: Partial<LineaVentaForm> = {}): LineaVentaForm {
  return {
    idProducto: "p1",
    nombre: "Aguacate",
    codigo: "AGU",
    idBodega: "b1",
    cantidadInput: "2",
    cajasInput: "1",
    presentacion: "Granel",
    especificacion: "",
    descuentoPctInput: "",
    ivaPct: "0",
    kgDisponible: 10,
    unidadMedida: "kg",
    precioUnitario: 40,
    precioInput: "40",
    ...partial,
  };
}

function entrada(partial: Record<string, unknown> = {}) {
  const ordenesTrabajoForm: never[] = [];
  return {
    isDraft: false,
    codigoCuenta: "demo",
    hasProductos: true,
    step: "form",
    isEditing: false,
    pendingEmitId: null,
    idComprador: "c1",
    setError: vi.fn(),
    showToast: vi.fn(),
    startMode: "scratch",
    avisosCatalogoValidacion: [] as unknown[],
    skipDiscrepanciaConfirmRef: { current: false },
    setConfirmDiscrepanciasOpen: vi.fn(),
    exigeOc: false,
    ordenCompraHotel: "",
    syncActiveOtFromForm: () => ordenesTrabajoForm,
    ordenesTrabajoForm,
    applyOrdenesTrabajo: vi.fn(),
    lineas: [linea()],
    fechaEntrega: "2099-01-15",
    origenCorreoDraft: [],
    setFechaEntrega: vi.fn(),
    setMissingFields: vi.fn(),
    ventanaDesde: "",
    ventanaHasta: "",
    formScrollRef: { current: null },
    bodegasDestino: [{ idBodega: "bd1", label: "CEDIS (C1)" }],
    idBodegaDestino: "bd1",
    skipSaveConfirmRef: { current: true },
    setConfirmSaveOpen: vi.fn(),
    ...partial,
  };
}

describe("validarEnvioOv", () => {
  it("fuera del formulario no valida", () => {
    const setError = vi.fn();
    expect(validarEnvioOv(entrada({ step: "start", setError }))).toBeNull();
    expect(setError).not.toHaveBeenCalled();
  });

  it("confirmar sin cliente avisa y muestra el toast", () => {
    const input = entrada({ idComprador: "" });
    expect(validarEnvioOv(input)).toBeNull();
    expect(input.setError).toHaveBeenCalledWith("Selecciona un cliente.");
    expect(input.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "No se pudo confirmar", variant: "error" }),
    );
  });

  it("un avance nuevo sin cliente no muestra el toast de confirmar", () => {
    const input = entrada({ isDraft: true, idComprador: "" });
    expect(validarEnvioOv(input)).toBeNull();
    expect(input.setError).toHaveBeenCalledWith("Selecciona un cliente.");
    expect(input.showToast).not.toHaveBeenCalled();
  });

  it("un avance de una orden ya abierta puede seguir sin cliente", () => {
    const input = entrada({ isDraft: true, isEditing: true, idComprador: "", lineas: [] });
    const preparado = validarEnvioOv(input);
    expect(input.setError).not.toHaveBeenCalled();
    expect(preparado?.lineasParsed).toEqual([]);
  });

  it("REQ-199: un avance desde documentos puede seguir sin cliente (Mateo aún no lo identificó)", () => {
    const input = entrada({ isDraft: true, startMode: "docs", idComprador: "", lineas: [] });
    const preparado = validarEnvioOv(input);
    expect(input.setError).not.toHaveBeenCalled();
    expect(preparado?.lineasParsed).toEqual([]);
  });

  it("REQ-199: un avance desde documentos puede ir sin líneas de catálogo", () => {
    const input = entrada({
      isDraft: true,
      startMode: "docs",
      lineas: [linea({ catalogPending: true, idProducto: "" })],
    });
    expect(validarEnvioOv(input)).not.toBeNull();
    expect(input.setError).not.toHaveBeenCalledWith(
      "Identifica al menos un producto del catálogo para guardar el avance.",
    );
  });

  it("REQ-199: confirmar desde documentos sin cliente sigue exigiéndolo", () => {
    const input = entrada({ isDraft: false, startMode: "docs", idComprador: "" });
    expect(validarEnvioOv(input)).toBeNull();
    expect(input.setError).toHaveBeenCalledWith("Selecciona un cliente.");
  });

  it("confirmar desde documentos con avisos abre el diálogo y se detiene", () => {
    const input = entrada({
      startMode: "docs",
      avisosCatalogoValidacion: [{ fieldKey: "fechaEntrega" }],
    });
    expect(validarEnvioOv(input)).toBeNull();
    expect(input.setConfirmDiscrepanciasOpen).toHaveBeenCalledWith(true);
    expect(input.skipDiscrepanciaConfirmRef.current).toBe(false);
  });

  it("un cliente que exige orden de compra no confirma sin número", () => {
    const input = entrada({ exigeOc: true, ordenCompraHotel: "  " });
    expect(validarEnvioOv(input)).toBeNull();
    expect(input.setError).toHaveBeenCalledWith(
      "Este cliente exige orden de compra para facturar. Captúrala en el pedido.",
    );
  });

  it("confirmar con un producto sin catálogo se detiene", () => {
    const input = entrada({
      lineas: [linea({ catalogPending: true, idProducto: "" })],
    });
    expect(validarEnvioOv(input)).toBeNull();
    expect(input.setError).toHaveBeenCalledWith(
      "Hay productos no identificados. Elige uno del catálogo o quita la línea.",
    );
  });

  it("un avance nuevo sin líneas de catálogo pide identificar un producto", () => {
    const input = entrada({
      isDraft: true,
      lineas: [linea({ catalogPending: true, idProducto: "" })],
    });
    expect(validarEnvioOv(input)).toBeNull();
    expect(input.setError).toHaveBeenCalledWith(
      "Identifica al menos un producto del catálogo para guardar el avance.",
    );
  });

  it("confirmar sin fecha pide la fecha de entrega", () => {
    const input = entrada({ fechaEntrega: "" });
    expect(validarEnvioOv(input)).toBeNull();
    expect(input.setError).toHaveBeenCalledWith("Ingresa la fecha de entrega.");
  });

  it("con datos mínimos y la confirmación ya aceptada devuelve las líneas", () => {
    const input = entrada();
    const preparado = validarEnvioOv(input);
    expect(preparado?.lineasParsed).toEqual([
      expect.objectContaining({ idProducto: "p1", cantidadPedida: 2 }),
    ]);
    expect(preparado?.bodegaDestinoLabel).toBe("CEDIS (C1)");
    expect(preparado?.fechaEntregaPersist).toBe("2099-01-15");
    expect(input.setConfirmSaveOpen).not.toHaveBeenCalled();
    expect(input.skipSaveConfirmRef.current).toBe(false);
  });
});
