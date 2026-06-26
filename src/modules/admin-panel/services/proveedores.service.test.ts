import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  createProveedorAdmin,
  decodeProveedorRazonSocial,
  listProveedoresAdmin,
} from "./proveedores.service";

describe("proveedores.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("decodifica empresa y contacto desde razon_social", () => {
    expect(
      decodeProveedorRazonSocial("Distribuidora ABC — Luis Castillo"),
    ).toEqual({
      proveedor: "Distribuidora ABC",
      nombre: "Luis Castillo",
    });
  });

  it("listProveedoresAdmin filtra por cuenta activa", async () => {
    const { client, from, chain } = createSupabaseMock({
      data: [
        {
          id_proveedor: "11111111-1111-1111-1111-111111111111",
          codigo: "ABC12",
          razon_social: "Distribuidora ABC — Luis Castillo",
          telefono: "+573001234567",
          email: "luis@abc.com",
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listProveedoresAdmin({ codigoCuenta: "FOODS1" });

    expect(from).toHaveBeenCalledWith("proveedor");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "FOODS1");
    expect(chain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows[0]).toMatchObject({
      codigo: "ABC12",
      proveedor: "Distribuidora ABC",
      nombre: "Luis Castillo",
      telefono: "+573001234567",
      email: "luis@abc.com",
    });
  });

  it("createProveedorAdmin inserta proveedor con teléfono internacional", async () => {
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: {
        id_proveedor: "22222222-2222-2222-2222-222222222222",
        codigo: "DISTR",
        razon_social: "Distribuidora ABC — Luis Castillo",
        telefono: "+573001234567",
        email: "luis@abc.com",
      },
      error: null,
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createProveedorAdmin({
      codigoCuenta: "FOODS1",
      proveedor: "Distribuidora ABC",
      nombre: "Luis Castillo",
      telefono: "+573001234567",
      email: "luis@abc.com",
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_cuenta: "FOODS1",
        razon_social: "Distribuidora ABC — Luis Castillo",
        telefono: "+573001234567",
        email: "luis@abc.com",
        esta_activo: true,
      }),
    );
    expect(row.nombre).toBe("Luis Castillo");
  });
});
