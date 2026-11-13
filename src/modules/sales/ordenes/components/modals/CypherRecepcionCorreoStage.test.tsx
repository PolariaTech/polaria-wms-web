import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { OvDelMismoCorreo } from "../../../shared/services/ovs-del-mismo-correo";
import { CypherRecepcionCorreoStage } from "./CypherRecepcionCorreoStage";

let hermanasSimuladas: OvDelMismoCorreo[] = [];

vi.mock("./use-ovs-del-mismo-correo", () => ({
  useOvsDelMismoCorreo: () => ({ hermanas: hermanasSimuladas, cargando: false }),
}));

vi.mock("./CypherOrigenAdjuntosBlock", () => ({
  CypherOrigenAdjuntosBlock: ({ esDeEstaOv }: { esDeEstaOv?: (a: { nombre: string }) => boolean }) => (
    <div data-testid="adjuntos">
      {esDeEstaOv
        ? `propia:${esDeEstaOv({ nombre: "OC-140188.pdf" })}/${esDeEstaOv({ nombre: "OC-140182.pdf" })}`
        : "sin-insignia"}
    </div>
  ),
}));

const orden = {
  id_orden_venta: "ov-1",
  orden_compra_hotel: "4500140188",
  origen_archivos: "[]",
} as unknown as OrdenVentaDetalleRow;

function pintar() {
  return render(
    <CypherRecepcionCorreoStage
      openStages={new Set(["correo"])}
      toggleAccordionStage={vi.fn()}
      correoChrome={{}}
      origenNombres={[]}
      recibida=""
      cuerpoCompleto=""
      cuerpoMensaje=""
      origenAdjuntosStored={[{ nombre: "OC-140188.pdf" }]}
      emlInnerAdjuntos={[]}
      emlInnerLoading={false}
      origenAdjuntos={[{ nombre: "OC-140188.pdf" }]}
      orden={orden}
      codigoCuenta="1YW43"
    />,
  );
}

describe("CypherRecepcionCorreoStage (REQ-271, REQ-313)", () => {
  beforeEach(() => {
    hermanasSimuladas = [];
  });

  it("usa número 00 — primera etapa de Cypher", () => {
    pintar();

    expect(screen.getByText("00")).toBeInTheDocument();
    expect(screen.getByText("Recepción del correo")).toBeInTheDocument();
  });

  it("sin hermanas no hay aviso ni insignia (control)", () => {
    pintar();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByTestId("adjuntos")).toHaveTextContent("sin-insignia");
  });

  it("con hermanas pinta el aviso encima de ADJUNTOS y marca la OC de esta OV", () => {
    hermanasSimuladas = [
      { idOrdenVenta: "ov-1", codigo: "OV-00001874", ordenCompra: "4500140188" },
      { idOrdenVenta: "ov-2", codigo: "OV-00001873", ordenCompra: "4500140182" },
    ];

    pintar();

    const aviso = screen.getByRole("status");
    expect(aviso).toHaveTextContent("Este correo se partió en 2 OV");
    const adjuntos = screen.getByText("ADJUNTOS");
    expect(aviso.compareDocumentPosition(adjuntos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("adjuntos")).toHaveTextContent("propia:true/false");
  });
});
