import { describe, expect, it } from "vitest";
import {
  collectFrequentNumericOcs,
  collectFromFilenames,
  collectFromLabels,
  collectFromRequisicionLabels,
  isGarbageOcValue,
  looksLikeArticuloSku,
  looksLikeOcCode,
  looksLikeUsuarioId,
} from "./normalize-numero-pedido-patrones";

describe("normalize-numero-pedido-patrones", () => {
  it("distingue IDs de usuario, SKUs con ceros a la izquierda y códigos OC", () => {
    expect(looksLikeUsuarioId("3672091")).toBe(true);
    expect(looksLikeUsuarioId("50184")).toBe(false);
    expect(looksLikeArticuloSku("00001678")).toBe(true);
    expect(looksLikeArticuloSku("000000000028593")).toBe(false);
    expect(looksLikeOcCode("4501056534")).toBe(true);
    expect(looksLikeOcCode("PO12345")).toBe(true);
    expect(looksLikeOcCode("rAutorizado")).toBe(false);
  });

  it("detecta valores basura de OCR/PDF", () => {
    expect(isGarbageOcValue("")).toBe(true);
    expect(isGarbageOcValue("rAutorizado")).toBe(true);
    expect(isGarbageOcValue("Departamento")).toBe(true);
    expect(isGarbageOcValue("00001678")).toBe(true);
    expect(isGarbageOcValue("4501056534")).toBe(false);
  });

  it("recolecta requisiciones antes y después del rótulo y etiquetas OC/PO", () => {
    expect(
      collectFromRequisicionLabels("50179REQUISICION # y REQUISICION # 50180"),
    ).toEqual(["50179", "50180"]);
    expect(
      collectFromLabels("Oc Generada: 4501056534 | PO # PO-998877"),
    ).toEqual(["4501056534", "PO-998877"]);
  });

  it("extrae OCs desde nombres de archivo y por frecuencia numérica", () => {
    expect(
      collectFromFilenames(["/docs/4501056534_PEDIDO.pdf", "nota.pdf"]),
    ).toEqual(["4501056534"]);
    const freq = collectFrequentNumericOcs(
      "fila1 4501056534 fila2 4501056534 fila3 123456789",
    );
    expect(freq[0]).toEqual({ value: "4501056534", count: 2 });
    expect(freq[1]).toEqual({ value: "123456789", count: 1 });
  });
});
