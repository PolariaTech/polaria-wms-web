import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSolicitudCompraCreate } from "./useSolicitudCompraCreate";

const productosMock = [
  { idProducto: "p-1", titulo: "Pollo", sku: "P1" },
];

vi.mock("@/modules/admin-panel", () => ({
  listBodegasInternasVinculadasAdmin: vi.fn(async () => []),
  listCatalogoProductosAdmin: vi.fn(async () => productosMock),
  listProveedoresAdmin: vi.fn(async () => [
    { idProveedor: "pv-1", proveedor: "ACME", nombre: "ACME" },
  ]),
}));
vi.mock("../../shared/services/purchases-api.service", () => ({
  createSolicitudCompraApi: vi.fn(),
}));
vi.mock("../services/solicitud-compra-n8n-client.service", () => ({
  buildSolicitudCompraN8nBody: vi.fn(),
  notifySolicitudCompraN8n: vi.fn(),
}));
vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "CUENTA-01", activeBodegaId: "BOD-01" }),
}));

describe("useSolicitudCompraCreate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("carga opciones al abrir", async () => {
    const { result } = renderHook(() =>
      useSolicitudCompraCreate({
        open: true,
        onClose: vi.fn(),
        onCreated: vi.fn(),
      }),
    );

    await waitFor(() => expect(result.current.productos).toHaveLength(1));
    expect(result.current.proveedores).toHaveLength(1);
    expect(result.current.isLoadingOptions).toBe(false);
  });

  it("addLine valida producto y peso, luego agrega", async () => {
    const { result } = renderHook(() =>
      useSolicitudCompraCreate({
        open: true,
        onClose: vi.fn(),
        onCreated: vi.fn(),
      }),
    );
    await waitFor(() => expect(result.current.productos).toHaveLength(1));

    act(() => result.current.addLine());
    expect(result.current.error).toBe("Selecciona un producto del catálogo.");

    act(() => result.current.setPickProductId("p-1"));
    act(() => result.current.addLine());
    expect(result.current.error).toMatch(/peso en kg mayor a 0/);

    act(() => result.current.setPickPesoKg("15,6"));
    act(() => result.current.addLine());
    expect(result.current.lines).toEqual([
      {
        idProducto: "p-1",
        pesoKg: 15.6,
        titleSnapshot: "Pollo",
        skuSnapshot: "P1",
      },
    ]);

    act(() => result.current.removeLine(0));
    expect(result.current.lines).toEqual([]);
  });

  it("handleClose no cierra mientras se envía y sí en reposo", async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useSolicitudCompraCreate({ open: true, onClose, onCreated: vi.fn() }),
    );

    act(() => result.current.handleClose());
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
