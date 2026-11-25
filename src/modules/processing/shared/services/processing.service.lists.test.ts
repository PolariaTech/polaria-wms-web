import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";

const api = vi.hoisted(() => ({
  listSolicitudesProcesamientoApi: vi.fn(),
  listTareasColaApi: vi.fn(),
}));

vi.mock("./processing-api.service", () => ({
  listSolicitudesProcesamientoApi: api.listSolicitudesProcesamientoApi,
}));

vi.mock("@/modules/operations", () => ({
  listTareasColaApi: api.listTareasColaApi,
}));

import * as barrel from "./processing.service";
import {
  listSolicitudesProcesamiento,
  listTareasCola,
} from "./processing.service.lists";

describe("processing.service.lists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.listSolicitudesProcesamiento).toBe(listSolicitudesProcesamiento);
    expect(barrel.listTareasCola).toBe(listTareasCola);
  });

  it("sin cuenta o bodega falla y no llama Nest", async () => {
    await expect(listSolicitudesProcesamiento({})).rejects.toBeInstanceOf(
      DomainServiceError,
    );
    await expect(
      listSolicitudesProcesamiento({ codigoCuenta: "023WA" }),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect(api.listSolicitudesProcesamientoApi).not.toHaveBeenCalled();
  });

  it("con scope llama Nest y no cae a Supabase", async () => {
    api.listSolicitudesProcesamientoApi.mockResolvedValue([{ id: "s1" }]);
    const rows = await listSolicitudesProcesamiento({
      codigoCuenta: "023WA",
      idBodega: "bod-1",
    });
    expect(rows).toEqual([{ id: "s1" }]);
    expect(api.listSolicitudesProcesamientoApi).toHaveBeenCalledWith({
      codigoCuenta: "023WA",
      idBodega: "bod-1",
    });
  });

  it("listTareasCola exige scope", async () => {
    await expect(listTareasCola({ codigoCuenta: "x" })).rejects.toBeInstanceOf(
      DomainServiceError,
    );
    api.listTareasColaApi.mockResolvedValue([]);
    await listTareasCola({ codigoCuenta: "023WA", idBodega: "bod-1" });
    expect(api.listTareasColaApi).toHaveBeenCalledWith({
      codigoCuenta: "023WA",
      idBodega: "bod-1",
    });
  });
});
