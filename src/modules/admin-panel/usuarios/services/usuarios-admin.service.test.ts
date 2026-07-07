import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/wms/roles";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import {
  createUsuarioAdmin,
  listUsuariosAdmin,
} from "./usuarios-admin.service";

vi.mock("@/config/env", () => ({
  env: { apiBaseUrl: "http://localhost:3000" },
  getApiBaseUrl: () => "/api",
}));

describe("usuarios-admin.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listUsuariosAdmin consulta operadores activos de la cuenta", async () => {
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
          username: "OPER01",
          nombre: "Operador Demo",
          correo: "operador@empresa.com",
          created_at: "2026-01-15T10:00:00.000Z",
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listUsuariosAdmin({ codigoCuenta: "MIT00" });

    expect(from).toHaveBeenCalledWith("usuario");
    expect(selectChain.select).toHaveBeenCalledWith(
      "id_usuario,username,nombre,correo,created_at",
    );
    expect(selectChain.eq).toHaveBeenCalledWith("codigo_cuenta", "MIT00");
    expect(selectChain.eq).toHaveBeenCalledWith(
      "id_rol",
      WmsRol.operador_cuenta,
    );
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows).toEqual([
      {
        idUsuario: "usr-1",
        nombre: "Operador Demo",
        correo: "operador@empresa.com",
        codigo: "OPER01",
        createdAt: "2026-01-15T10:00:00.000Z",
      },
    ]);
  });

  it("createUsuarioAdmin llama al endpoint de administración", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          idUsuario: "usr-2",
          username: "OPER02",
          nombre: "Nuevo Operador",
          idRol: WmsRol.operador_cuenta,
          codigoCuenta: "MIT00",
          correo: "nuevo@empresa.com",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const created = await createUsuarioAdmin({
      codigoCuenta: "MIT00",
      codigoEmpresa: "ACME",
      nombre: "Nuevo Operador",
      correo: "nuevo@empresa.com",
      clave: "secreto123",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/administracion/usuarios",
      expect.objectContaining({ method: "POST" }),
    );
    expect(created.idUsuario).toBe("usr-2");
    expect(created.codigo).toBe("OPER02");
    expect(created.nombre).toBe("Nuevo Operador");
  });
});
