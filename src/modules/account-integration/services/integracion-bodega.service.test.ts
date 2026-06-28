import { describe, expect, it, afterEach, vi } from "vitest";
import {
  formatEstadoIntegracion,
  formatTipoIntegracion,
} from "../constants/integration-types";
import {
  createSolicitudIntegracion,
  listSolicitudesIntegracion,
} from "./integracion-bodega.service";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";

const listClientesAdmin = vi.fn();

vi.mock("@/modules/admin-panel/services/clientes.service", () => ({
  listClientesAdmin: (...args: unknown[]) => listClientesAdmin(...args),
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
    listClientesAdmin.mockResolvedValue([
      { idCliente: "cli-1", codigo: "CLI-01", nombre: "Cliente", nit: "900" },
    ]);

    const single = vi.fn().mockResolvedValue({
      data: {
        id_solicitud_integracion: "sol-2",
        codigo_cuenta: "CUENTA-01",
        id_cliente: "cli-1",
        bodega_externa_id: "bod-2",
        bodega_externa_nombre: "Bodega Sur",
        scraping: true,
        api: false,
        csv_plano: false,
        estado: "activo",
        created_at: "2026-06-28T13:00:00.000Z",
        id_solicitante: "usr-1",
      },
      error: null,
    });

    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single }),
    });

    mockSupabaseClient({
      solicitudIntegracion: { insert },
    });

    const row = await createSolicitudIntegracion({
      codigoCuenta: "CUENTA-01",
      idSolicitante: "usr-1",
      bodegaExternaId: "bod-2",
      bodegaExternaNombre: "Bodega Sur",
      tipoIntegracion: "scraping",
    });

    expect(insert).toHaveBeenCalledWith({
      codigo_cuenta: "CUENTA-01",
      id_cliente: "cli-1",
      bodega_externa_id: "bod-2",
      bodega_externa_nombre: "Bodega Sur",
      scraping: true,
      api: false,
      csv_plano: false,
      id_solicitante: "usr-1",
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
});
