import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUDIT_LIST_LIMIT,
  setSupabaseClientForTests,
} from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import { listAuditoriaOperacion } from "./audit.service";

describe("audit.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listAuditoriaOperacion aplica límite por defecto de auditoría", async () => {
    const { client, from, chain } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listAuditoriaOperacion({ codigoCuenta: "CUENTA-01" });

    expect(from).toHaveBeenCalledWith("auditoria_operacion");
    expect(chain.limit).toHaveBeenCalledWith(AUDIT_LIST_LIMIT);
  });
});
