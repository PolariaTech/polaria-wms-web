import { describe, expect, it } from "vitest";
import * as salesServiceHelpers from "./shared/services/sales.service.test-helpers";
import * as mapPedidoHelpers from "./ordenes/utils/pedido/map-pedido-extraido-to-form.test-helpers";
import * as modalHelpers from "./ordenes/components/modals/OrdenVentaReagruparOtModal.test-helpers";
import * as matchHelpers from "./ordenes/utils/match/find-closest-producto-catalogo.test-helpers";
import * as otHelpers from "./ordenes/utils/ot/reagrupar-ordenes-trabajo.test-helpers";
import * as estadoHelpers from "./ordenes/utils/ot/reagrupacion-modal-estado.test-helpers";
import * as printHelpers from "./ordenes/print/orden-tarea-almacen.test-helpers";

describe("sales split test-helpers smoke", () => {
  it("exporta fixtures compartidas", () => {
    expect(salesServiceHelpers.createBodegaChain).toBeTypeOf("function");
    expect(mapPedidoHelpers.emptyPedido).toBeTypeOf("function");
    expect(modalHelpers.montar).toBeTypeOf("function");
    expect(matchHelpers.productos).toBeDefined();
    expect(matchHelpers.productos!.length).toBeGreaterThan(0);
    expect(otHelpers.escenario).toBeTypeOf("function");
    expect(estadoHelpers.correr).toBeTypeOf("function");
    expect(printHelpers.LIST_ROW.idOrdenVenta).toBe("ov-1");
  });
});