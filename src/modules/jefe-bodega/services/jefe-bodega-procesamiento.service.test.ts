import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/processing", () => ({
  listSolicitudesProcesamientoOperador: vi.fn(),
  asignarOperarioProcesamiento: vi.fn(),
}));

vi.mock("@/modules/operations", () => ({
  listTareasColaApi: vi.fn(),
}));

import { listSolicitudesProcesamientoOperador } from "@/modules/processing";
import { listTareasColaApi } from "@/modules/operations";
import { listSolicitudesProcesamientoPendientesJefe } from "./jefe-bodega-procesamiento.service";

describe("jefe-bodega-procesamiento.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propaga error de listados scoped (sin tragar catch vacío)", async () => {
    vi.mocked(listSolicitudesProcesamientoOperador).mockResolvedValue([]);
    vi.mocked(listTareasColaApi).mockRejectedValue(new Error("API caída"));

    await expect(
      listSolicitudesProcesamientoPendientesJefe({
        codigoCuenta: "C1",
        idBodega: "B1",
      }),
    ).rejects.toThrow("API caída");
  });
});
