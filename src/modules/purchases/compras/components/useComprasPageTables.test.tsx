import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  OrdenCompraRow,
  SolicitudCompraRow,
} from "../../shared/types/purchases.types";
import type { ComprasPageTableCtx } from "./compras-page-content.table-types";
import { useComprasPageTables } from "./useComprasPageTables";

vi.mock("../../shared/services/purchases-api.service", () => ({
  aprobarSolicitudCompraApi: vi.fn(),
  convertirSolicitudCompraAOrdenApi: vi.fn(),
  emitirOrdenCompraApi: vi.fn(),
}));

function buildCtx(overrides: Partial<ComprasPageTableCtx> = {}) {
  return {
    puedeAprobarSolicitud: true,
    pendingActionId: null,
    pickingSolicitud: null,
    notifiedOrdenIds: new Set<string>(),
    startEnviarAprobacion: vi.fn(),
    runAction: vi.fn(async () => undefined),
    runNotifyProveedor: vi.fn(async () => undefined),
    solicitudes: {} as ComprasPageTableCtx["solicitudes"],
    ordenes: {} as ComprasPageTableCtx["ordenes"],
    ...overrides,
  } satisfies ComprasPageTableCtx;
}

describe("useComprasPageTables", () => {
  it("expone columnas de solicitudes y órdenes", () => {
    const { result } = renderHook(() => useComprasPageTables(buildCtx()));

    expect(result.current.solicitudColumns.map((c) => c.id)).toEqual([
      "codigo",
      "productos",
      "peso",
    ]);
    expect(result.current.ordenColumns.map((c) => c.id)).toEqual([
      "orden",
      "proveedor",
      "productos",
      "estado",
      "fecha",
      "observacion",
    ]);
  });

  it("renderSolicitudActions ofrece enviar aprobación en borrador", () => {
    const { result } = renderHook(() => useComprasPageTables(buildCtx()));

    render(
      <>
        {result.current.renderSolicitudActions({
          id_solicitud_compra: "s-1",
          estado: "borrador",
        } as SolicitudCompraRow)}
      </>,
    );

    expect(
      screen.getByRole("button", { name: "Enviar aprobación" }),
    ).toBeEnabled();
  });

  it("renderOrdenActions devuelve null si ya fue notificada", () => {
    const ctx = buildCtx({ notifiedOrdenIds: new Set(["oc-1"]) });
    const { result } = renderHook(() => useComprasPageTables(ctx));

    expect(
      result.current.renderOrdenActions({
        id_orden_compra: "oc-1",
        estado: "emitida",
      } as OrdenCompraRow),
    ).toBeNull();
  });
});
