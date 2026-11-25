import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import type { OvPaneles } from "../../hooks/use-ov-paneles";
import { crearOnBorrarOv } from "./crear-on-borrar-ov";

const borrar = vi.fn();
const registrarLog = vi.fn();
vi.mock("../../../shared/services/sales.service", () => ({
  borrarOrdenVenta: (...a: unknown[]) => borrar(...a),
}));
vi.mock("./registrar-log-cancelacion-ov", () => ({
  registrarLogCancelacionOv: (...a: unknown[]) => registrarLog(...a),
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ session: { nombre: " Ana ", idUsuario: "u-1" } }) },
}));

const fila = { idOrdenVenta: "ov-1", idBodega: "b-1" } as OrdenVentaOperadorRow;

function armar(parcial: { cypherId?: string | null; editingId?: string | null; detalleId?: string | null } = {}) {
  const paneles = {
    cypherId: "cypherId" in parcial ? parcial.cypherId : "ov-1",
    setCypherId: vi.fn(),
    setCompanionOtPicker: vi.fn(),
    editingId: parcial.editingId ?? null,
    setEditingId: vi.fn(),
    setIsCreateOpen: vi.fn(),
    detalleId: parcial.detalleId ?? null,
    setDetalleId: vi.fn(),
    editLock: { resetLockUi: vi.fn() },
  };
  const args = {
    codigoCuenta: "C-1" as string | null,
    inspect: false,
    runScoped: <T,>(fn: () => Promise<T>) => fn(),
    rows: [fila],
    paneles: paneles as unknown as OvPaneles,
    setBusyAction: vi.fn(),
    reload: vi.fn().mockResolvedValue(undefined),
  };
  return { paneles, args };
}

describe("crearOnBorrarOv", () => {
  beforeEach(() => {
    borrar.mockReset().mockResolvedValue(undefined);
    registrarLog.mockReset();
  });

  it.each([
    ["inspección", { inspect: true }],
    ["sin cuenta", { codigoCuenta: null }],
  ])("devuelve undefined con %s", (_n, cambio) => {
    const { args } = armar();
    expect(crearOnBorrarOv({ ...args, ...cambio })).toBeUndefined();
  });

  it("devuelve undefined sin Cypher abierto", () => {
    const { args } = armar({ cypherId: null });
    expect(crearOnBorrarOv(args)).toBeUndefined();
  });

  it("si la OV no está en el listado lanza NOT_FOUND sin borrar", async () => {
    const { args } = armar({ cypherId: "otra" });
    const onBorrar = crearOnBorrarOv(args)!;
    await expect(onBorrar()).rejects.toBeInstanceOf(DomainServiceError);
    expect(borrar).not.toHaveBeenCalled();
    expect(args.setBusyAction).not.toHaveBeenCalled();
  });

  it("borra, registra la cancelación, cierra los paneles de esa OV y recarga", async () => {
    const { args, paneles } = armar({ editingId: "ov-1", detalleId: "ov-1" });
    await crearOnBorrarOv(args)!();
    expect(args.setBusyAction).toHaveBeenNthCalledWith(1, { id: "ov-1", kind: "borrar" });
    expect(borrar).toHaveBeenCalledWith({ codigoCuenta: "C-1", idOrdenVenta: "ov-1" });
    expect(registrarLog).toHaveBeenCalledWith({
      idOrdenVenta: "ov-1",
      codigoCuenta: "C-1",
      autor: "Ana",
      idUsuario: "u-1",
      autorNombre: " Ana ",
      idBodega: "b-1",
    });
    expect(paneles.setCypherId).toHaveBeenCalledWith(null);
    expect(paneles.setEditingId).toHaveBeenCalledWith(null);
    expect(paneles.setIsCreateOpen).toHaveBeenCalledWith(false);
    expect(paneles.editLock.resetLockUi).toHaveBeenCalled();
    expect(paneles.setDetalleId).toHaveBeenCalledWith(null);
    expect(args.reload).toHaveBeenCalled();
    expect(args.setBusyAction).toHaveBeenLastCalledWith(null);
  });

  it("no cierra el formulario ni el detalle de otra OV", async () => {
    const { args, paneles } = armar({ editingId: "otra", detalleId: "otra" });
    await crearOnBorrarOv(args)!();
    expect(paneles.setEditingId).not.toHaveBeenCalled();
    expect(paneles.setDetalleId).not.toHaveBeenCalled();
  });

  it("si el borrado falla relanza el error y deja de estar ocupado", async () => {
    borrar.mockRejectedValue(new Error("falló"));
    const { args } = armar();
    await expect(crearOnBorrarOv(args)!()).rejects.toThrow("falló");
    expect(registrarLog).not.toHaveBeenCalled();
    expect(args.setBusyAction).toHaveBeenLastCalledWith(null);
  });
});
