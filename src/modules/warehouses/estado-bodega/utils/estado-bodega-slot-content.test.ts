import { describe, expect, it } from "vitest";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import {
  buildSlotDetalleFromRows,
  formatTemperaturaSlot,
  resolveIdPaquete,
  resolveProductoNombre,
} from "./estado-bodega-slot-content";

const baseRow: WarehouseStateRow = {
  id_warehouse_state: "ws-1",
  codigo_cuenta: "49M04",
  id_bodega: "b-1",
  id_ubicacion: "u-1",
  id_producto: "p-1",
  id_lote: "l-1",
  cantidad: "60",
  cantidad_reservada: "0",
  temperatura: "0",
  locked_by: null,
  locked_at: null,
  version: 1,
  updated_at: "2026-07-08T00:00:00.000Z",
  producto: {
    id_producto: "p-1",
    sku: "IOZ7Z",
    descripcion: "HPR FROZEN-PORK RACKS",
    metadatos_catalogo: { titulo: "HPR FROZEN-PORK RACKS" },
  },
  lote: {
    id_lote: "l-1",
    codigo_lote: "REC-1783517194758-53920736",
    id_cliente: null,
    id_proveedor: "prov-1",
    id_linea_orden_compra: "loc-1",
    cliente: null,
    proveedor: {
      id_proveedor: "prov-1",
      razon_social: "Pat-Lafrieda",
      codigo: "PL",
    },
    orden_compra_linea: {
      id_linea_orden_compra: "loc-1",
      id_orden_compra: "oc-1",
      orden_compra: {
        id_orden_compra: "oc-1",
        codigo: "OC-000005",
      },
    },
  },
  cuenta: {
    codigo_cuenta: "49M04",
    nombre_comercial: "Tecno-Tech",
  },
};

describe("estado-bodega-slot-content", () => {
  it("extrae id de paquete compartido desde codigo_lote de recepción", () => {
    expect(resolveIdPaquete("REC-1783517194758-53920736")).toBe(
      "REC-1783517194758",
    );
    expect(resolveIdPaquete("CAJ-2024-001")).toBe("CAJ-2024-001");
  });

  it("resuelve nombre de producto con sku + título", () => {
    expect(resolveProductoNombre(baseRow)).toBe("IOZ7Z HPR FROZEN-PORK RACKS");
  });

  it("formatea temperatura", () => {
    expect(formatTemperaturaSlot("0")).toBe("0 °C");
    expect(formatTemperaturaSlot("-18.5")).toBe("-18,5 °C");
  });

  it("arma detalle de slot para modal/celda", () => {
    expect(buildSlotDetalleFromRows([baseRow], "ING-01")).toEqual({
      productoNombre: "IOZ7Z HPR FROZEN-PORK RACKS",
      idPaquete: "OC-000005",
      cliente: "Pat-Lafrieda",
      cantidad: "60 kg",
      posicion: "ING-01",
      temperatura: "0 °C",
      ordenCompraCodigo: "OC-000005",
      lockedBy: null,
    });
  });

  it("usa prefijo REC cuando no hay orden de compra", () => {
    const rowSinOrden: WarehouseStateRow = {
      ...baseRow,
      lote: {
        ...baseRow.lote!,
        orden_compra_linea: null,
        proveedor: null,
      },
    };

    expect(buildSlotDetalleFromRows([rowSinOrden], "ING-01")?.idPaquete).toBe(
      "REC-1783517194758",
    );
  });
});
