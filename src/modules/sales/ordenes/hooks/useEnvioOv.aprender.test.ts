import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrdenVenta, updateOrdenVenta } from "../../shared/services/sales.service";
import { emitirOrdenVentaApi } from "../../shared/services/sales-api.service";
import { aprenderEquivalencias } from "../../shared/services/aprender-equivalencias.service";
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

vi.mock("../../shared/services/aprender-equivalencias.service", () => ({
  aprenderEquivalencias: vi.fn().mockResolvedValue({
    creadas: 0,
    actualizadas: 0,
    fallidas: 0,
  }),
}));

const lineaCorregida = {
  idProducto: "p-elegido",
  aliasCliente: "Manzana verde",
  nombre: "MANZANA RED",
  propuestaSistema: { producto: { idProducto: "p-granny" } },
};

function estadoBase(parcial: Record<string, unknown> = {}) {
  return {
    isDraft: false,
    isEditing: false,
    pendingEmitId: null,
    editingId: "",
    editingEstado: null,
    codigoCuenta: "demo",
    idCreador: "u1",
    idComprador: "c1",
    session: { nombre: "Ana" },
    payload: { vendedor: "Ana", idBodega: "b1" },
    fechaEntrega: "2026-11-04",
    fechaEntregaPersist: "2026-11-04",
    ordenesTrabajoForm: [{ id: "ot-1" }],
    folioFactura: { guardar: vi.fn() },
    reagruparAplicada: null,
    lineas: [lineaCorregida],
    productosBase: [{ idProducto: "p-elegido" }],
    setPendingEmitId: vi.fn(),
    setEditingEstado: vi.fn(),
    setFechaEntrega: vi.fn(),
    setIsSaving: vi.fn(),
    setMateoBusyMessage: vi.fn(),
    setError: vi.fn(),
    showToast: vi.fn(),
    onCreated: vi.fn(),
    onClose: vi.fn(),
    onEmitSuccess: vi.fn(),
    ...parcial,
  };
}

describe("ejecutarPersistenciaEnvio aprende equivalencias", () => {
  beforeEach(() => {
    vi.mocked(createOrdenVenta).mockReset();
    vi.mocked(updateOrdenVenta).mockReset();
    vi.mocked(emitirOrdenVentaApi).mockReset();
    vi.mocked(aprenderEquivalencias).mockClear();
    vi.mocked(createOrdenVenta).mockResolvedValue({
      idOrdenVenta: "ov-1",
      venta: "OV-1",
    } as never);
    vi.mocked(updateOrdenVenta).mockResolvedValue({
      idOrdenVenta: "ov-1",
      venta: "OV-1",
    } as never);
    vi.mocked(emitirOrdenVentaApi).mockResolvedValue({
      idOrdenVenta: "ov-1",
      venta: "OV-1",
    } as never);
  });

  it("no aprende al guardar avance", async () => {
    await ejecutarPersistenciaEnvio(
      estadoBase({ isDraft: true }) as never,
    );
    expect(aprenderEquivalencias).not.toHaveBeenCalled();
  });

  it("aprende al emitir una OV nueva", async () => {
    await ejecutarPersistenciaEnvio(estadoBase() as never);
    expect(aprenderEquivalencias).toHaveBeenCalledWith({
      codigoCuenta: "demo",
      idComprador: "c1",
      aprendizajes: [{ frase: "Manzana verde", idProducto: "p-elegido" }],
    });
    expect(emitirOrdenVentaApi).toHaveBeenCalled();
  });

  it("aprende al guardar una OV ya confirmada", async () => {
    await ejecutarPersistenciaEnvio(
      estadoBase({
        isEditing: true,
        editingId: "ov-1",
        editingEstado: "confirmada",
      }) as never,
    );
    expect(aprenderEquivalencias).toHaveBeenCalledWith({
      codigoCuenta: "demo",
      idComprador: "c1",
      aprendizajes: [{ frase: "Manzana verde", idProducto: "p-elegido" }],
    });
    expect(emitirOrdenVentaApi).not.toHaveBeenCalled();
  });

  it("no envía aprendizajes de una línea aceptada sin cambios", async () => {
    await ejecutarPersistenciaEnvio(
      estadoBase({
        lineas: [
          {
            idProducto: "p-granny",
            aliasCliente: "Manzana verde",
            propuestaSistema: { producto: { idProducto: "p-granny" } },
          },
        ],
        productosBase: [{ idProducto: "p-granny" }],
      }) as never,
    );
    expect(aprenderEquivalencias).toHaveBeenCalledWith({
      codigoCuenta: "demo",
      idComprador: "c1",
      aprendizajes: [],
    });
  });
});
