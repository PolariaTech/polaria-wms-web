import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrdenVentaModalDialogs } from "./OrdenVentaCapturePreview";
import type { OrdenVentaModalDialogsProps } from "../../types/orden-venta-create-modal.types";

vi.mock("@/stores/shell-overlay.store", () => ({
  useShellOverlayStore: (
    selector: (state: { cypherWidthMode: string }) => unknown,
  ) => selector({ cypherWidthMode: "normal" }),
}));

vi.mock("./OrdenVentaReagruparOtModal", () => ({
  OrdenVentaReagruparOtModal: () => null,
}));

function propsBase(
  overrides: Partial<OrdenVentaModalDialogsProps> = {},
): OrdenVentaModalDialogsProps {
  return {
    confirmDiscrepanciasOpen: false,
    setConfirmDiscrepanciasOpen: vi.fn(),
    skipDiscrepanciaConfirmRef: { current: false },
    skipSaveConfirmRef: { current: false },
    handleSubmit: vi.fn(),
    avisosValidacion: [],
    canReemplazarDiscrepancia: () => false,
    handleReemplazarDiscrepancia: vi.fn(),
    confirmSaveOpen: true,
    setConfirmSaveOpen: vi.fn(),
    esPorConfirmar: true,
    fechaEntrega: "2026-11-12",
    setMissingFields: vi.fn(),
    setError: vi.fn(),
    isEditing: true,
    editingEstado: "por_confirmar",
    fechaEntregaAtrasada: false,
    avisoPotencialDuplicado: null,
    confirmDiscardOpen: false,
    setConfirmDiscardOpen: vi.fn(),
    onClose: vi.fn(),
    ordenesTrabajoForm: { length: 1 },
    confirmRemoveOtId: null,
    setConfirmRemoveOtId: vi.fn(),
    handleConfirmRemoveOrdenTrabajo: vi.fn(),
    addOtOpen: false,
    setAddOtOpen: vi.fn(),
    addOtAlmacen: "",
    setAddOtAlmacen: vi.fn(),
    addOtNumeroPedido: "",
    setAddOtNumeroPedido: vi.fn(),
    handleAddOrdenTrabajo: vi.fn(),
    reagruparOpen: false,
    cypherOpen: true,
    editingId: "ov-1",
    folioVisible: "OV-1",
    setReagruparOpen: vi.fn(),
    obtenerSolicitudReagrupacion: () => null,
    handleAplicarReagrupacion: vi.fn(),
    handleAplicarCorreccionCorreo: vi.fn(),
    handleDividirOrden: vi.fn(),
    ...overrides,
  };
}

describe("OrdenVentaModalDialogs (REQ-304)", () => {
  it("con Cypher abierto el confirm de guardar va a body y en dock-left", () => {
    render(<OrdenVentaModalDialogs {...propsBase({ cypherOpen: true })} />);

    const portal = document.body.querySelector(
      "[data-polaria-confirm-portal]",
    );
    expect(portal).toBeTruthy();
    expect(portal?.parentElement).toBe(document.body);
    expect(portal?.className).toContain("z-[120]");
    expect(screen.getByText("¿Confirmar el pedido?")).toBeTruthy();
  });
});
