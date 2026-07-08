import { describe, expect, it } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type { OrdenCompraRow } from "../../shared/types/purchases.types";
import {
  buildRecepcionLineasDraft,
  canSubmitRecepcionDraft,
  formatOrdenIngresoSelectLabel,
  parseRecepcionLineasPayload,
} from "./recepcion-compra-draft";

const ORDEN: OrdenCompraRow = {
  id_orden_compra: "oc-1",
  codigo_cuenta: "MITOO",
  id_bodega: "bod-1",
  id_proveedor: "prov-1",
  proveedor_nombre: "Pat lafrida",
  id_solicitud_compra: null,
  id_creador: null,
  codigo: "OC-0001",
  estado: "emitida",
  fecha_emision: "2026-07-01T12:00:00.000Z",
  fecha_entrega_estimada: "2026-07-07T12:00:00.000Z",
  destino_tipo: "interna",
  observaciones: null,
  created_at: "2026-07-01T12:00:00.000Z",
  updated_at: "2026-07-01T12:00:00.000Z",
  lineas: [
    {
      id_linea_orden_compra: "line-1",
      id_producto: "prod-1",
      cantidad: 66,
      cantidad_recibida: 0,
      producto: {
        sku: "BPTOMFRF",
        descripcion: "FROZEN-PRIME BEEF",
        metadatos_catalogo: null,
      },
    },
  ],
};

describe("recepcion-compra-draft", () => {
  it("formatea etiqueta del selector de orden", () => {
    expect(formatOrdenIngresoSelectLabel(ORDEN)).toBe(
      "OC-0001 · MITOO · Pat lafrida",
    );
  });

  it("arma borrador con líneas pendientes incluidas", () => {
    const draft = buildRecepcionLineasDraft(ORDEN.lineas ?? []);

    expect(draft).toHaveLength(1);
    expect(draft[0]?.incluida).toBe(true);
    expect(draft[0]?.cantidadRecibidaInput).toBe("66");
  });

  it("valida payload de líneas incluidas", () => {
    const draft = buildRecepcionLineasDraft(ORDEN.lineas ?? []).map((linea) => ({
      ...linea,
      temperaturaInput: "-18",
    }));
    const payload = parseRecepcionLineasPayload(draft);

    expect(payload).toEqual([
      {
        idLineaOrdenCompra: "line-1",
        cantidadRecibida: 66,
        temperaturaRegistrada: -18,
      },
    ]);
  });

  it("exige temperatura y peso en líneas incluidas para habilitar envío", () => {
    const draft = buildRecepcionLineasDraft(ORDEN.lineas ?? []);

    expect(canSubmitRecepcionDraft(draft, null)).toBe(false);

    expect(
      canSubmitRecepcionDraft(
        draft.map((linea) => ({ ...linea, temperaturaInput: "-18" })),
        null,
      ),
    ).toBe(true);
  });

  it("exige al menos una línea incluida", () => {
    const draft = buildRecepcionLineasDraft(ORDEN.lineas ?? []).map((linea) => ({
      ...linea,
      incluida: false,
    }));

    expect(() => parseRecepcionLineasPayload(draft)).toThrow(DomainServiceError);
    expect(canSubmitRecepcionDraft(draft, null)).toBe(false);
  });
});
