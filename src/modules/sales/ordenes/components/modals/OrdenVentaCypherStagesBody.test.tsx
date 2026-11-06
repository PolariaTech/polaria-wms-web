import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaCypherStagesBody } from "./OrdenVentaCypherStagesBody";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";

vi.mock("./CypherDatosFiscalesSection", () => ({
  CypherDatosFiscalesSection: () => <div data-testid="mock-fiscales" />,
}));
vi.mock("./CypherRecepcionCorreoStage", () => ({
  CypherRecepcionCorreoStage: () => <div data-testid="mock-correo" />,
}));
vi.mock("./CypherConfirmacionStage", () => ({
  CypherConfirmacionStage: () => <div data-testid="mock-confirmacion" />,
}));
vi.mock("./CypherClienteVsMateoSection", () => ({
  CypherClienteVsMateoSection: () => <div data-testid="mock-cliente-vs" />,
}));
vi.mock("./CypherCambioEstadoPipelineStage", () => ({
  CypherCambioEstadoPipelineStage: () => <div data-testid="mock-cambio-estado" />,
}));
vi.mock("./CypherBitacoraSection", () => ({
  CypherBitacoraSection: () => <div data-testid="mock-bitacora" />,
}));

const ordenBase = {
  id_orden_venta: "ov-1",
  id_comprador: "c-1",
  estado: "por_confirmar",
  lineas: [],
} as OrdenVentaDetalleRow;

const noop = () => {};

describe("OrdenVentaCypherStagesBody", () => {
  it("monta las secciones principales", () => {
    const { getByTestId } = render(
      <OrdenVentaCypherStagesBody
        orden={ordenBase}
        codigoCuenta="cuenta"
        companionIdComprador={null}
        openStages={new Set()}
        toggleAccordionStage={noop}
        correoChrome={{}}
        origenNombres={[]}
        recibida="—"
        cuerpoCompleto=""
        cuerpoMensaje=""
        origenAdjuntosStored={[]}
        emlInnerAdjuntos={[]}
        emlInnerLoading={false}
        origenAdjuntos={[]}
        activeOtPicker={null}
        estado="por_confirmar"
        comprador="Cliente"
        occ="—"
        zonaHoraria="UTC"
        lineas={[]}
        hijasFromOrden={[]}
        puedeAlmacen={false}
        onFotos={noop}
        estadosSuperiores={[]}
        estadoCambiando={null}
        setCambioEstadoError={noop}
        setEstadoPendiente={noop}
        logLoading={false}
        logEntries={[]}
        idOrdenTrabajoBitacora={null}
      />,
    );
    expect(getByTestId("mock-correo")).toBeInTheDocument();
    expect(getByTestId("mock-fiscales")).toBeInTheDocument();
    // REQ-271: Correo antes que Fiscales en el DOM.
    expect(
      getByTestId("mock-correo").compareDocumentPosition(
        getByTestId("mock-fiscales"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(getByTestId("mock-confirmacion")).toBeInTheDocument();
    expect(getByTestId("mock-cliente-vs")).toBeInTheDocument();
    expect(getByTestId("mock-cambio-estado")).toBeInTheDocument();
    expect(getByTestId("mock-bitacora")).toBeInTheDocument();
  });
});
