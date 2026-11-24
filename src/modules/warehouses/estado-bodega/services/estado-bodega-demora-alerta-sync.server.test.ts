import { beforeEach, describe, expect, it, vi } from "vitest";

const from = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({ from }),
}));

describe("estado-bodega-demora-alerta-sync.server", () => {
  beforeEach(() => {
    from.mockReset();
  });

  it("countAlertasOperativasHistorialServer usa límite y filtra llamadas a jefe", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        { id_alerta: "1", metadata: { subtipo: "llamada_jefe" } },
        { id_alerta: "2", metadata: { origen: "demora" } },
      ],
      error: null,
    });
    const eq2 = vi.fn(() => ({ limit }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const select = vi.fn(() => ({ eq: eq1 }));
    from.mockReturnValue({ select });

    const { countAlertasOperativasHistorialServer } = await import(
      "./estado-bodega-demora-alerta-sync.server"
    );
    await expect(
      countAlertasOperativasHistorialServer({
        codigoCuenta: "C-1",
        idBodega: "b-1",
      }),
    ).resolves.toBe(1);
    expect(limit).toHaveBeenCalledWith(2000);
  });
});
