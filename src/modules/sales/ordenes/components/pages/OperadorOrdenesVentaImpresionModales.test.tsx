/* eslint-disable @typescript-eslint/no-explicit-any -- capturas de props de mocks */
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import {
  OperadorOrdenesVentaImpresionModales,
  type OperadorOrdenesVentaImpresionModalesProps,
} from "./OperadorOrdenesVentaImpresionModales";

const { captura, stub } = vi.hoisted(() => {
  const captura: Record<string, Record<string, any>> = {};
  const stub = (nombre: string) => (p: Record<string, unknown>) => {
    captura[nombre] = p;
    return null;
  };
  return { captura, stub };
});
vi.mock("../modals/OrdenVentaSeleccionOtModal", () => ({ OrdenVentaSeleccionOtModal: stub("seleccion") }));
vi.mock("./OvImpresionResultadoModal", () => ({ OvImpresionResultadoModal: stub("resultado") }));
vi.mock("../modals/OrdenVentaPdfPreviewModal", () => ({ OrdenVentaPdfPreviewModal: stub("pdf") }));
vi.mock("../modals/OrdenVentaFotosCapturaModal", () => ({ OrdenVentaFotosCapturaModal: stub("fotos") }));

const row = { idOrdenVenta: "ov-1", venta: "OV-1" } as OrdenVentaOperadorRow;

function props(
  parcial: Partial<OperadorOrdenesVentaImpresionModalesProps> = {},
): OperadorOrdenesVentaImpresionModalesProps {
  return {
    cypherId: null,
    busyAction: null,
    seleccionOt: null,
    onCerrarSeleccionOt: vi.fn(),
    cargarHojas: vi.fn().mockResolvedValue(["hoja"]),
    onConfirmarSeleccionOt: vi.fn(),
    feedback: null,
    onReintentar: vi.fn(),
    onCerrarFeedback: vi.fn(),
    pdfPreview: null,
    onCerrarPdf: vi.fn(),
    fotosPreview: null,
    onSelectFotosOt: vi.fn(),
    onVolverALasOt: vi.fn(),
    onCerrarFotos: vi.fn(),
    ...parcial,
  };
}

describe("OperadorOrdenesVentaImpresionModales", () => {
  beforeEach(() => {
    for (const k of Object.keys(captura)) delete captura[k];
  });

  it("todos los modales arrancan cerrados", () => {
    render(<OperadorOrdenesVentaImpresionModales {...props()} />);
    expect(captura.seleccion!.open).toBe(false);
    expect(captura.resultado!.resultado).toBeNull();
    expect(captura.pdf!.open).toBe(false);
    expect(captura.fotos!.open).toBe(false);
  });

  it("selección de OT: carga hojas de su fila y confirma con la selección actual", async () => {
    const p = props({ seleccionOt: { row, accion: "descargar", yaImpresa: true } });
    render(<OperadorOrdenesVentaImpresionModales {...p} />);
    expect(captura.seleccion).toMatchObject({ open: true, accion: "descargar", folio: "OV-1", yaImpresa: true });
    await expect(captura.seleccion!.cargarHojas()).resolves.toEqual(["hoja"]);
    expect(p.cargarHojas).toHaveBeenCalledWith(row);
    captura.seleccion!.onConfirmar([1, 3]);
    expect(p.onConfirmarSeleccionOt).toHaveBeenCalledWith(p.seleccionOt, [1, 3]);
  });

  it("sin selección, cargarHojas devuelve vacío y confirmar solo cierra", async () => {
    const p = props();
    render(<OperadorOrdenesVentaImpresionModales {...p} />);
    await expect(captura.seleccion!.cargarHojas()).resolves.toEqual([]);
    captura.seleccion!.onConfirmar([1]);
    expect(p.onCerrarSeleccionOt).toHaveBeenCalled();
    expect(p.onConfirmarSeleccionOt).not.toHaveBeenCalled();
  });

  it("resultado: ocupado según busyAction y reintento solo si hay destino", () => {
    const retry = { idOrdenVenta: "ov-1", venta: "OV-1", idBodega: null };
    const p = props({
      busyAction: { id: "ov-1", kind: "print" },
      feedback: { ok: false, title: "t", lines: [], retry },
    });
    render(<OperadorOrdenesVentaImpresionModales {...p} />);
    expect(captura.resultado).toMatchObject({ ocupado: true, reintentando: true });
    captura.resultado!.onReintentar();
    expect(p.onReintentar).toHaveBeenCalledWith(retry);

    const q = props({ feedback: { ok: true, title: "t", lines: [], retry: null } });
    render(<OperadorOrdenesVentaImpresionModales {...q} />);
    captura.resultado!.onReintentar();
    expect(q.onReintentar).not.toHaveBeenCalled();
  });

  it("PDF: carga mientras no hay blob ni error y se acopla al Cypher", () => {
    render(
      <OperadorOrdenesVentaImpresionModales
        {...props({ cypherId: "ov-1", pdfPreview: { title: "Prev", blob: null, error: null } })}
      />,
    );
    expect(captura.pdf).toMatchObject({ open: true, title: "Prev", isLoading: true, dockWithCypher: true });

    render(
      <OperadorOrdenesVentaImpresionModales
        {...props({ pdfPreview: { title: "Prev", blob: null, error: "x" } })}
      />,
    );
    expect(captura.pdf).toMatchObject({ isLoading: false, error: "x", dockWithCypher: false });
  });

  it("fotos: acopla al Cypher solo en modo bloqueado a una OT y delega acciones", () => {
    const p = props({
      cypherId: "ov-1",
      fotosPreview: {
        idOrdenVenta: "ov-1",
        title: "Fotos · OV-1",
        ordenesTrabajo: [],
        selectedOt: "ot-1",
        fotos: [],
        loadingOts: false,
        loadingFotos: true,
        lockToOt: true,
        error: null,
      },
    });
    render(<OperadorOrdenesVentaImpresionModales {...p} />);
    expect(captura.fotos).toMatchObject({
      open: true,
      selectedOt: "ot-1",
      isLoadingFotos: true,
      allowBackToOts: false,
      dockWithCypher: true,
    });
    captura.fotos!.onSelectOt("ot-2");
    captura.fotos!.onBackToOts();
    captura.fotos!.onClose();
    expect(p.onSelectFotosOt).toHaveBeenCalledWith("ot-2");
    expect(p.onVolverALasOt).toHaveBeenCalled();
    expect(p.onCerrarFotos).toHaveBeenCalled();
  });
});
