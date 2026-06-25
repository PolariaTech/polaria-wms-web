import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/roles";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { listUsuariosConfigurator } from "./usuarios.service";

describe("usuarios.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listUsuariosConfigurator consulta tabla usuario con rol y cuenta", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.order.mockReturnValue(selectChain);
    selectChain.limit.mockResolvedValue({
      data: [
        {
          id_usuario: "usr-1",
          username: "ADMIN01",
          nombre: "Admin Demo",
          id_auth: "auth-1",
          rol: { id_rol: WmsRol.administrador_cuenta, nombre: "Administrador de cuenta" },
          cuenta: { nombre_comercial: "Mitre" },
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listUsuariosConfigurator();

    expect(from).toHaveBeenCalledWith("usuario");
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows).toEqual([
      {
        idUsuario: "usr-1",
        codigo: "ADMIN01",
        rol: "Administrador de cuenta",
        nombre: "Admin Demo",
        cuenta: "Mitre",
        tieneCredenciales: true,
      },
    ]);
  });
});
