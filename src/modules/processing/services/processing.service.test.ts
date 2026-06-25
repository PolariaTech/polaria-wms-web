import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  listSolicitudesProcesamiento,
  listTareasCola,
} from "./processing.service";

describe("processing.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listSolicitudesProcesamiento consulta solicitud_procesamiento", async () => {
    const { client, from } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listSolicitudesProcesamiento({
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    });

    expect(from).toHaveBeenCalledWith("solicitud_procesamiento");
  });

  it("listTareasCola consulta tarea_cola", async () => {
    const { client, from } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listTareasCola({
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    });

    expect(from).toHaveBeenCalledWith("tarea_cola");
  });
});
