import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { withCuentaSchema } from "./cuenta-schema";

describe("withCuentaSchema", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("apunta el schema emp_* de la empresa de la cuenta", async () => {
    const schemaFrom = vi.fn();
    const empresaChain = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
    };
    empresaChain.select.mockReturnValue(empresaChain);
    empresaChain.eq.mockReturnValue(empresaChain);
    empresaChain.limit.mockResolvedValue({
      data: [{ schema_name: "emp_andino_4v053" }],
      error: null,
    });

    const cuentaChain = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
    };
    cuentaChain.select.mockReturnValue(cuentaChain);
    cuentaChain.eq.mockReturnValue(cuentaChain);
    cuentaChain.limit.mockResolvedValue({
      data: [{ codigo_cuenta: "4V053", codigo_empresa: "4V053" }],
      error: null,
    });

    schemaFrom.mockImplementation((table: string) => {
      if (table === "cuenta") return cuentaChain;
      return empresaChain;
    });

    const from = vi.fn((table: string) => {
      if (table === "empresa") return empresaChain;
      return cuentaChain;
    });

    setSupabaseClientForTests({
      from,
      schema: vi.fn(() => ({ from: schemaFrom })),
    } as never);

    const result = await withCuentaSchema("4V053", async () => "ok");

    expect(result).toBe("ok");
    expect(schemaFrom).toHaveBeenCalledWith("cuenta");
    expect(from).toHaveBeenCalledWith("empresa");
  });
});
