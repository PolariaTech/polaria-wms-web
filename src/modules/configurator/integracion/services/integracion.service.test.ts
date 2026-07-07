import { describe, expect, it, afterEach, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { listSolicitudesIntegracionConfigurator } from "./integracion.service";

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

describe("integracion.service (configurator)", () => {
  afterEach(() => {
    setSupabaseClientForTests(null);
    vi.clearAllMocks();
  });

  it("lista solicitudes de integración en scope platform sin filtrar por cuenta", async () => {
    mockSupabaseClient({
      solicitudIntegracion: {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id_solicitud_integracion: "sol-1",
              codigo_cuenta: "MIT00",
              id_cliente: "cli-1",
              bodega_externa_id: "bod-1",
              bodega_externa_nombre: "Bodega Norte",
              scraping: false,
              api: true,
              csv_plano: false,
              estado: "activo",
              created_at: "2026-06-28T12:00:00.000Z",
              id_solicitante: "usr-1",
              cuenta: { nombre_comercial: "Mitre" },
              solicitante: {
                correo: "ops@mitre.com",
                nombre: "Operador Mitre",
              },
            },
          ],
          error: null,
        }),
      },
    });

    const rows = await listSolicitudesIntegracionConfigurator();

    expect(rows).toEqual([
      {
        idSolicitudIntegracion: "sol-1",
        codigoCuenta: "MIT00",
        cuentaNombre: "Mitre",
        bodegaExternaId: "bod-1",
        bodegaNombre: "Bodega Norte",
        tipoIntegracion: "api",
        estado: "activo",
        createdAt: "2026-06-28T12:00:00.000Z",
        solicitanteCorreo: "ops@mitre.com",
        solicitanteNombre: "Operador Mitre",
      },
    ]);
  });
});
