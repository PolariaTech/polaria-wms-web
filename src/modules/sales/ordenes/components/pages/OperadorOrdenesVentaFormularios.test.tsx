/* eslint-disable @typescript-eslint/no-explicit-any -- capturas de props de mocks */
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import type { OvPaneles } from "../../hooks/use-ov-paneles";
import { OperadorOrdenesVentaFormularios } from "./OperadorOrdenesVentaFormularios";

let detalle: Record<string, any> = {};
let crear: Record<string, any> = {};
vi.mock("../modals/OrdenVentaDetalleModal", () => ({
  OrdenVentaDetalleModal: (p: Record<string, unknown>) => {
    detalle = p;
    return null;
  },
}));
vi.mock("../modals/OrdenVentaCreateModal", () => ({
  OrdenVentaCreateModal: (p: Record<string, unknown>) => {
    crear = p;
    return null;
  },
}));

function armar(
  parcial: { inspect?: boolean; cypherId?: string | null; detalleId?: string | null; editingId?: string | null; isCreateOpen?: boolean } = {},
) {
  const paneles = {
    cypherId: parcial.cypherId ?? null,
    detalleId: parcial.detalleId ?? null,
    editingId: parcial.editingId ?? null,
    createDraftId: null,
    isCreateOpen: parcial.isCreateOpen ?? false,
    reagruparAlAbrirId: null,
    editLock: { soloLectura: false, holderNombre: "Luis" },
    setCypherId: vi.fn(),
    setDetalleId: vi.fn(),
    setCompanionOtPicker: vi.fn(),
    setCompanionIdComprador: vi.fn(),
    setCreateDraftId: vi.fn(),
    limpiarReagruparAlAbrir: vi.fn(),
    cerrarFormulario: vi.fn(),
  };
  const props = {
    paneles: paneles as unknown as OvPaneles,
    codigoCuenta: "C-1",
    inspect: parcial.inspect ?? false,
    rows: [{ idOrdenVenta: "ov-1", venta: "OV-1" }] as unknown as OrdenVentaOperadorRow[],
    onReload: vi.fn(),
    onEmitSuccess: vi.fn(),
    onAutoPrintResult: vi.fn(),
  };
  render(<OperadorOrdenesVentaFormularios {...props} />);
  return { paneles, props };
}

describe("OperadorOrdenesVentaFormularios", () => {
  beforeEach(() => {
    detalle = {};
    crear = {};
  });

  it("el detalle recibe su id y la cuenta; el formulario se abre solo fuera de inspección", () => {
    armar({ detalleId: "ov-1", isCreateOpen: true });
    expect(detalle.idOrdenVenta).toBe("ov-1");
    expect(detalle.codigoCuenta).toBe("C-1");
    expect(crear.open).toBe(true);

    armar({ inspect: true, isCreateOpen: true });
    expect(crear.open).toBe(false);
    expect(detalle.onEmitted).toBeUndefined();
    expect(detalle.onEmitSuccess).toBeUndefined();
    expect(detalle.onAutoPrintResult).toBeUndefined();
  });

  it("cypherOpen del detalle exige que detalle y Cypher sean la misma OV y no inspección", () => {
    armar({ detalleId: "ov-1", cypherId: "ov-1" });
    expect(detalle.cypherOpen).toBe(true);
    armar({ detalleId: "ov-1", cypherId: "ov-2" });
    expect(detalle.cypherOpen).toBe(false);
  });

  it("onToggleCypher alterna el Cypher de la OV del detalle", () => {
    const { paneles } = armar({ detalleId: "ov-1" });
    detalle.onToggleCypher();
    const alternar = paneles.setCypherId.mock.calls[0]![0] as (prev: string | null) => string | null;
    expect(alternar(null)).toBe("ov-1");
    expect(alternar("ov-1")).toBeNull();
  });

  it("sin detalle abierto no hay onToggleCypher", () => {
    armar();
    expect(detalle.onToggleCypher).toBeUndefined();
  });

  it("cerrar el detalle cierra también el Cypher de ese pedido, no otro", () => {
    const { paneles } = armar({ detalleId: "ov-1" });
    detalle.onClose();
    expect(paneles.setDetalleId).toHaveBeenCalledWith(null);
    expect(paneles.setCompanionOtPicker).toHaveBeenCalledWith(null);
    const cerrar = paneles.setCypherId.mock.calls[0]![0] as (prev: string | null) => string | null;
    expect(cerrar("ov-1")).toBeNull();
    expect(cerrar("ov-2")).toBe("ov-2");
  });

  it("el formulario busca el folio de la OV editada y pasa el lock", () => {
    armar({ editingId: "ov-1", isCreateOpen: true });
    expect(crear.codigoVenta).toBe("OV-1");
    expect(crear.soloLectura).toBe(false);
    expect(crear.editLockHolderNombre).toBe("Luis");
  });

  it("onOrdenIdReady guarda el borrador y abre su Cypher; cerrar vuelve al detalle", () => {
    const { paneles } = armar({ editingId: "ov-1", isCreateOpen: true });
    crear.onOrdenIdReady("nuevo");
    expect(paneles.setCreateDraftId).toHaveBeenCalledWith("nuevo");
    expect(paneles.setCypherId).toHaveBeenCalledWith("nuevo");
    crear.onClose();
    expect(paneles.cerrarFormulario).toHaveBeenCalledWith(true);
  });

  it("reagrupar al cargar solo aplica a la OV editada y sin solo lectura", () => {
    const paneles = {
      cypherId: null,
      detalleId: null,
      editingId: "ov-1",
      createDraftId: null,
      isCreateOpen: true,
      reagruparAlAbrirId: "ov-1",
      editLock: { soloLectura: false, holderNombre: null },
      setCypherId: vi.fn(),
      setDetalleId: vi.fn(),
      setCompanionOtPicker: vi.fn(),
      setCompanionIdComprador: vi.fn(),
      setCreateDraftId: vi.fn(),
      limpiarReagruparAlAbrir: vi.fn(),
      cerrarFormulario: vi.fn(),
    };
    render(
      <OperadorOrdenesVentaFormularios
        paneles={paneles as unknown as OvPaneles}
        codigoCuenta="C-1"
        inspect={false}
        rows={[]}
        onReload={vi.fn()}
        onEmitSuccess={vi.fn()}
        onAutoPrintResult={vi.fn()}
      />,
    );
    expect(crear.abrirReagruparAlCargar).toBe(true);
    expect(crear.onReagruparAlCargarAtendido).toBe(paneles.limpiarReagruparAlAbrir);
  });
});
