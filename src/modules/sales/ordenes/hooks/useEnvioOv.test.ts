import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrdenVenta } from "../../shared/services/sales.service";
import { postOrdenVentaLogForOts } from "../services/orden-venta-log.client";
import { ejecutarPersistenciaEnvio } from "./useEnvioOv";

vi.mock("../../shared/services/sales.service", () => ({
  createOrdenVenta: vi.fn(),
  updateOrdenVenta: vi.fn(),
  getOrdenVentaDetalle: vi.fn(),
}));

vi.mock("../../shared/services/sales-api.service", () => ({
  emitirOrdenVentaApi: vi.fn(),
}));

vi.mock("../services/orden-venta-log.client", () => ({
  postOrdenVentaLog: vi.fn(),
  postOrdenVentaLogForOts: vi.fn(),
}));

vi.mock("../print/auto-print-ov-tras-emitir", () => ({
  fetchAutoImprimirFlag: vi.fn(),
  autoPrintOrdenVentaTrasEmitir: vi.fn(),
}));

describe("ejecutarPersistenciaEnvio", () => {
  beforeEach(() => {
    vi.mocked(createOrdenVenta).mockReset();
    vi.mocked(postOrdenVentaLogForOts).mockReset();
  });

  it("un avance nuevo crea la orden, avisa y no cierra el modal", async () => {
    vi.mocked(createOrdenVenta).mockResolvedValue({
      idOrdenVenta: "ov-1",
      venta: "OV-1",
    } as never);
    const showToast = vi.fn();
    const onCreated = vi.fn();
    const onClose = vi.fn();
    const setFechaEntrega = vi.fn();
    const setIsSaving = vi.fn();
    const guardar = vi.fn();

    await ejecutarPersistenciaEnvio({
      isDraft: true,
      isEditing: false,
      pendingEmitId: null,
      editingId: "",
      editingEstado: null,
      codigoCuenta: "demo",
      idCreador: "u1",
      session: { nombre: "Ana" },
      payload: { vendedor: "Ana", idBodega: "b1" },
      fechaEntrega: "",
      fechaEntregaPersist: "2026-11-04",
      ordenesTrabajoForm: [{ id: "ot-1" }],
      folioFactura: { guardar },
      reagruparAplicada: null,
      setPendingEmitId: vi.fn(),
      setEditingEstado: vi.fn(),
      setFechaEntrega,
      setIsSaving,
      setMateoBusyMessage: vi.fn(),
      setError: vi.fn(),
      showToast,
      onCreated,
      onClose,
    });

    expect(createOrdenVenta).toHaveBeenCalledWith({
      vendedor: "Ana",
      idBodega: "b1",
    });
    expect(guardar).toHaveBeenCalledWith("ov-1", "demo");
    expect(setFechaEntrega).toHaveBeenCalledWith("2026-11-04");
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Avance guardado", variant: "success" }),
    );
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(setIsSaving).toHaveBeenCalledWith(false);
  });
});
