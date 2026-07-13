import { describe, expect, it } from "vitest";
import {
  buildRolDevolucionObservacion,
  parseRolDevolucionProcesamiento,
  solicitudTieneSobrantePendiente,
} from "./procesamiento-post-cierre";

describe("procesamiento-post-cierre", () => {
  it("parsea rolDevolucion en observaciones", () => {
    expect(
      parseRolDevolucionProcesamiento(
        "flujo:post_cierre|rolDevolucion:procesado|solicitudProcesamiento:abc",
      ),
    ).toBe("procesado");
    expect(
      parseRolDevolucionProcesamiento(
        null,
        "Procesamiento → Almacenamiento · rolDevolucion:desperdicio",
      ),
    ).toBe("desperdicio");
    expect(parseRolDevolucionProcesamiento("sin rol")).toBeNull();
  });

  it("construye observación de rol", () => {
    expect(buildRolDevolucionObservacion("procesado")).toBe(
      "rolDevolucion:procesado",
    );
  });

  it("detecta sobrante pendiente", () => {
    expect(solicitudTieneSobrantePendiente("2.5")).toBe(true);
    expect(solicitudTieneSobrantePendiente(0)).toBe(false);
    expect(solicitudTieneSobrantePendiente(null)).toBe(false);
  });
});
