import { describe, expect, it, afterEach, vi } from "vitest";
import {
  formatEstadoIntegracion,
  formatTipoIntegracion,
  isSolicitudIntegracionPendiente,
} from "../constants/integration-types";
import {
  createSolicitudIntegracion,
  listSolicitudesIntegracion,
} from "./integracion-bodega.service";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";

const listClientesAdmin = vi.fn();
const apiRequest = vi.fn();

vi.mock("@/modules/admin-panel/clientes/services/clientes.service", () => ({
  listClientesAdmin: (...args: unknown[]) => listClientesAdmin(...args),
}));

vi.mock("@/services/api/api", () => ({
  apiRequest: (...args: unknown[]) => apiRequest(...args),
}));

function mockSupabaseClient(handlers: {
  solicitudIntegracion?: Record<string, unknown>;
}) {
  const from = vi.fn((table: string) => {
    if (table === "solicitud_integracion") {
      return handlers.solicitudIntegracion ?? {};
    }

    throw new Error(`Tabla no mockeada: ${table}`);
  });

  setSupabaseClientForTests({ from } as never);
}

describe("integracion-bodega.service", () => {
  afterEach(() => {
    setSupabaseClientForTests(null);
    vi.clearAllMocks();
  });

  it("lista solicitudes de integración por cuenta", async () => {
    mockSupabaseClient({
      solicitudIntegracion: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id_solicitud_integracion: "sol-1",
              codigo_cuenta: "CUENTA-01",
              id_cliente: "cli-1",
              bodega_externa_id: "bod-1",
              bodega_externa_nombre: "Bodega Norte",
              scraping: false,
              api: true,
              csv_plano: false,
              estado: "activo",
              created_at: "2026-06-28T12:00:00.000Z",
              id_solicitante: "usr-1",
            },
          ],
          error: null,
        }),
      },
    });

    const rows = await listSolicitudesIntegracion({ codigoCuenta: "CUENTA-01" });

    expect(rows).toEqual([
      {
        idSolicitudIntegracion: "sol-1",
        bodegaExternaId: "bod-1",
        bodegaNombre: "Bodega Norte",
        tipoIntegracion: "api",
        estado: "activo",
        createdAt: "2026-06-28T12:00:00.000Z",
      },
    ]);
  });

  it("crea solicitud de integración", async () => {
    apiRequest.mockResolvedValue({
      idSolicitudIntegracion: "sol-2",
      bodegaExternaId: "bod-2",
      bodegaNombre: "Bodega Sur",
      tipoIntegracion: "scraping",
      estado: "activo",
      createdAt: "2026-06-28T13:00:00.000Z",
    });

    const row = await createSolicitudIntegracion({
      codigoCuenta: "CUENTA-01",
      idSolicitante: "usr-1",
      bodegaExternaId: "bod-2",
      bodegaExternaNombre: "Bodega Sur",
      tipoIntegracion: "scraping",
    });

    expect(apiRequest).toHaveBeenCalledWith("/integracion/solicitudes", {
      method: "POST",
      auth: true,
      body: {
        codigoCuenta: "CUENTA-01",
        bodegaExternaId: "bod-2",
        bodegaExternaNombre: "Bodega Sur",
        tipoIntegracion: "scraping",
      },
    });
    expect(row.bodegaNombre).toBe("Bodega Sur");
    expect(row.tipoIntegracion).toBe("scraping");
  });
});

describe("integration-types", () => {
  it("formatea tipo y estado", () => {
    expect(formatTipoIntegracion("csv_plano")).toBe("CSV plano");
    expect(formatEstadoIntegracion("activo")).toBe("Activa");
  });

  it("detecta solicitudes pendientes", () => {
    expect(isSolicitudIntegracionPendiente("activo")).toBe(true);
    expect(isSolicitudIntegracionPendiente("finalizado")).toBe(false);
  });
});
