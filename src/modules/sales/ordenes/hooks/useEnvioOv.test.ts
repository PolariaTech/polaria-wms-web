import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { patchCompradorDenominacionOverride } from "@/modules/admin-panel";
import { createOrdenVenta, updateOrdenVenta } from "../../shared/services/sales.service";
import { emitirOrdenVentaApi } from "../../shared/services/sales-api.service";
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
  fetchAutoImprimirFlag: vi.fn().mockResolvedValue(false),
  autoPrintOrdenVentaTrasEmitir: vi.fn(),
}));

vi.mock("@/modules/admin-panel", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/admin-panel")>();
  return {
    ...actual,
    patchCompradorDenominacionOverride: vi.fn(),
  };
});

vi.mock("../../shared/services/aprender-equivalencias.service", () => ({
  aprenderEquivalencias: vi.fn().mockResolvedValue({
    creadas: 0,
    actualizadas: 0,
    fallidas: 0,
  }),
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

  it("REQ-199: al crear la orden avisa su id al listado (para fijarla y poder abrir Cypher)", async () => {
    vi.mocked(createOrdenVenta).mockResolvedValue({
      idOrdenVenta: "ov-9",
      venta: "OV-9",
    } as never);
    const onOrdenIdReady = vi.fn();

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
      folioFactura: { guardar: vi.fn() },
      reagruparAplicada: null,
      setPendingEmitId: vi.fn(),
      setEditingEstado: vi.fn(),
      setFechaEntrega: vi.fn(),
      setIsSaving: vi.fn(),
      setMateoBusyMessage: vi.fn(),
      setError: vi.fn(),
      showToast: vi.fn(),
      onCreated: vi.fn(),
      onClose: vi.fn(),
      onOrdenIdReady,
    });

    expect(onOrdenIdReady).toHaveBeenCalledExactlyOnceWith("ov-9");
  });

  it("REQ-199: una orden ya abierta no vuelve a avisar un id nuevo", async () => {
    const onOrdenIdReady = vi.fn();
    vi.mocked(createOrdenVenta).mockReset();
    vi.mocked(updateOrdenVenta).mockResolvedValue({ idOrdenVenta: "ov-1" } as never);

    await ejecutarPersistenciaEnvio({
      isDraft: true,
      isEditing: true,
      pendingEmitId: null,
      editingId: "ov-1",
      editingEstado: "por_confirmar",
      codigoCuenta: "demo",
      idCreador: "u1",
      session: { nombre: "Ana" },
      payload: { vendedor: "Ana", idBodega: "b1" },
      fechaEntrega: "",
      fechaEntregaPersist: "2026-11-04",
      ordenesTrabajoForm: [{ id: "ot-1" }],
      folioFactura: { guardar: vi.fn() },
      reagruparAplicada: null,
      setPendingEmitId: vi.fn(),
      setEditingEstado: vi.fn(),
      setFechaEntrega: vi.fn(),
      setIsSaving: vi.fn(),
      setMateoBusyMessage: vi.fn(),
      setError: vi.fn(),
      showToast: vi.fn(),
      onCreated: vi.fn(),
      onClose: vi.fn(),
      onOrdenIdReady,
    });

    // la ruta de edición corrió de verdad (actualizó la OV abierta) y no creó ninguna nueva
    expect(updateOrdenVenta).toHaveBeenCalledWith(expect.objectContaining({ idOrdenVenta: "ov-1" }));
    expect(createOrdenVenta).not.toHaveBeenCalled();
    expect(onOrdenIdReady).not.toHaveBeenCalled();
  });

  it("REQ-241: si falla el patch de denominación (RLS operador), no tumba el confirm", async () => {
    vi.mocked(updateOrdenVenta).mockResolvedValue({
      idOrdenVenta: "ov-2151",
      venta: "OV-00002151",
    } as never);
    vi.mocked(emitirOrdenVentaApi).mockResolvedValue({
      idOrdenVenta: "ov-2151",
      venta: "OV-00002151",
    } as never);
    vi.mocked(patchCompradorDenominacionOverride).mockRejectedValue(
      new DomainServiceError(
        "No se pudo guardar la denominación comercial del cliente.",
        "MUTATION_FAILED",
      ),
    );

    const showToast = vi.fn();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const setError = vi.fn();

    await ejecutarPersistenciaEnvio({
      isDraft: false,
      isEditing: true,
      pendingEmitId: null,
      editingId: "ov-2151",
      editingEstado: "por_confirmar",
      codigoCuenta: "49M04",
      idCreador: "u1",
      idComprador: "comp-1",
      session: { nombre: "Operador" },
      payload: {
        vendedor: "Operador",
        idBodega: "b1",
        denominacionComercialOverride: "FIESTA AMERICANA",
      },
      fechaEntrega: "2026-11-17",
      fechaEntregaPersist: "2026-11-17",
      ordenesTrabajoForm: [{ id: "ot-1" }],
      folioFactura: { guardar: vi.fn() },
      reagruparAplicada: null,
      setPendingEmitId: vi.fn(),
      setEditingEstado: vi.fn(),
      setFechaEntrega: vi.fn(),
      setIsSaving: vi.fn(),
      setMateoBusyMessage: vi.fn(),
      setError,
      showToast,
      onCreated,
      onClose,
    });

    expect(patchCompradorDenominacionOverride).toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Aviso" }),
    );
    expect(setError).not.toHaveBeenCalled();
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("REQ-241: si el patch de denominación falla por otra causa, sí reporta error", async () => {
    vi.mocked(updateOrdenVenta).mockResolvedValue({
      idOrdenVenta: "ov-2151",
      venta: "OV-00002151",
    } as never);
    vi.mocked(patchCompradorDenominacionOverride).mockRejectedValue(
      new DomainServiceError(
        "Falta el identificador del comprador.",
        "INVALID_ARGUMENT",
      ),
    );

    const showToast = vi.fn();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const setError = vi.fn();

    await ejecutarPersistenciaEnvio({
      isDraft: false,
      isEditing: true,
      pendingEmitId: null,
      editingId: "ov-2151",
      editingEstado: "por_confirmar",
      codigoCuenta: "49M04",
      idCreador: "u1",
      idComprador: "comp-1",
      session: { nombre: "Operador" },
      payload: {
        vendedor: "Operador",
        idBodega: "b1",
        denominacionComercialOverride: "FIESTA AMERICANA",
      },
      fechaEntrega: "2026-11-17",
      fechaEntregaPersist: "2026-11-17",
      ordenesTrabajoForm: [{ id: "ot-1" }],
      folioFactura: { guardar: vi.fn() },
      reagruparAplicada: null,
      setPendingEmitId: vi.fn(),
      setEditingEstado: vi.fn(),
      setFechaEntrega: vi.fn(),
      setIsSaving: vi.fn(),
      setMateoBusyMessage: vi.fn(),
      setError,
      showToast,
      onCreated,
      onClose,
    });

    expect(setError).toHaveBeenCalledWith(
      "Falta el identificador del comprador.",
    );
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "No se pudo confirmar",
        variant: "error",
      }),
    );
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
