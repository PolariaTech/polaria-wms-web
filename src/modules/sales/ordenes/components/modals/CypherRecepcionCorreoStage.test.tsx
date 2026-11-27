import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { OvDelMismoCorreo } from "../../../shared/services/ovs-del-mismo-correo";
import { CypherRecepcionCorreoStage } from "./CypherRecepcionCorreoStage";

let hermanasSimuladas: OvDelMismoCorreo[] = [];

vi.mock("./use-ovs-del-mismo-correo", () => ({
  useOvsDelMismoCorreo: (input: {
    fallbackHermanas?: Array<{ idOrdenVenta: string; codigo: string; ordenCompra: string | null }>;
  }) => {
    const fallback = input.fallbackHermanas ?? [];
    const hermanas =
      hermanasSimuladas.length >= 2
        ? hermanasSimuladas
        : fallback.length >= 2
          ? fallback
          : hermanasSimuladas;
    return { hermanas, cargando: false };
  },
}));

vi.mock("@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria", () => ({
  useCuentaZonaHoraria: () => "America/Bogota",
}));

vi.mock("./CypherMoverAdjuntosPanel", () => ({
  CypherMoverAdjuntosPanel: ({
    idOrdenVenta,
    adjuntos,
    onAdjuntoMovido,
  }: {
    idOrdenVenta: string;
    adjuntos: Array<{ path?: string }>;
    onAdjuntoMovido: (path: string) => void;
  }) => (
    <div data-testid="panel-mover">
      {`${idOrdenVenta}:${adjuntos.length}`}
      <button type="button" onClick={() => onAdjuntoMovido(adjuntos[0]?.path ?? "")}>
        mover-primero
      </button>
    </div>
  ),
}));

vi.mock("./CypherOrigenAdjuntosBlock", () => ({
  CypherOrigenAdjuntosBlock: ({
    adjuntos,
    esDeEstaOv,
  }: {
    adjuntos: Array<{ nombre: string }>;
    esDeEstaOv?: (a: { nombre: string }) => boolean;
  }) => (
    <div data-testid="adjuntos" data-nombres={adjuntos.map((a) => a.nombre).join(",")}>
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

function pintar(extra?: { cuerpoCompleto?: string; cuerpoMensaje?: string }) {
  return render(
    <CypherRecepcionCorreoStage
      openStages={new Set(["correo"])}
      toggleAccordionStage={vi.fn()}
      correoChrome={{}}
      origenNombres={[]}
      recibida=""
      cuerpoCompleto={extra?.cuerpoCompleto ?? ""}
      cuerpoMensaje={extra?.cuerpoMensaje ?? ""}
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

  it("separa la llegada del correo de la fecha de creación de la OV", () => {
    const ordenCreada = {
      ...orden,
      created_at: "2026-11-25T03:15:46.507Z",
      fecha_pedido: "2026-11-25",
    } as unknown as OrdenVentaDetalleRow;

    render(
      <CypherRecepcionCorreoStage
        openStages={new Set(["correo"])}
        toggleAccordionStage={vi.fn()}
        correoChrome={{}}
        origenNombres={[]}
        recibida="12/11/26, 3:27 p.m."
        cuerpoCompleto=""
        cuerpoMensaje=""
        origenAdjuntosStored={[]}
        emlInnerAdjuntos={[]}
        emlInnerLoading={false}
        origenAdjuntos={[]}
        orden={ordenCreada}
        codigoCuenta="1YW43"
      />,
    );

    expect(screen.getByText("CORREO RECIBIDO")).toBeInTheDocument();
    expect(screen.getByText("12/11/26, 3:27 p.m.")).toBeInTheDocument();
    expect(screen.getByText("OV CREADA")).toBeInTheDocument();
    expect(screen.getByText(/24\/11\/26/)).toBeInTheDocument();
    expect(screen.queryByText("LLEGADA")).not.toBeInTheDocument();
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

  it("REQ-347: sin hermanas de query pero con anotación del listado muestra el aviso", () => {
    hermanasSimuladas = [];
    render(
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
        codigoOvListado="OV-00001874"
        correoPartido
        correoPartidoDe={["OV-00001873"]}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Este correo se partió en 2 OV");
    expect(screen.getByRole("status")).toHaveTextContent("OC 4500140188");
  });

  it("REQ-343: cuerpo con columnas dataTable se pinta como tabla, no <pre>", () => {
    const cuerpo = [
      "Buenas tardes,",
      "Fecha de entrega   Clave Sap    Texto breve   Um   Pedido",
      "27.08.2026         X200011700   AGUACATE      KG   37",
    ].join("\n");
    pintar({ cuerpoCompleto: cuerpo });
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("AGUACATE")).toBeInTheDocument();
    expect(document.querySelector("pre")).toBeNull();
  });
});

const HERMANAS_PARTIDO: OvDelMismoCorreo[] = [
  { idOrdenVenta: "ov-1", codigo: "OV-00001874", ordenCompra: "4500140188" },
  { idOrdenVenta: "ov-2", codigo: "OV-00001873", ordenCompra: "4500140182" },
];

const ADJUNTOS_GUARDADOS = [
  { nombre: "OC-140188.pdf", path: "cuenta/aaa-OC-140188.pdf" },
  { nombre: "OC-140182.pdf", path: "cuenta/aaa-OC-140182.pdf" },
];

function pintarReasignable(extra?: { estado?: string; guardados?: typeof ADJUNTOS_GUARDADOS }) {
  const guardados = extra?.guardados ?? ADJUNTOS_GUARDADOS;
  return render(
    <CypherRecepcionCorreoStage
      openStages={new Set(["correo"])}
      toggleAccordionStage={vi.fn()}
      correoChrome={{}}
      origenNombres={[]}
      recibida=""
      cuerpoCompleto=""
      cuerpoMensaje=""
      origenAdjuntosStored={guardados}
      emlInnerAdjuntos={[]}
      emlInnerLoading={false}
      origenAdjuntos={guardados}
      orden={{ ...orden, estado: extra?.estado ?? "por_confirmar" } as OrdenVentaDetalleRow}
      codigoCuenta="1YW43"
    />,
  );
}

describe("CypherRecepcionCorreoStage: reasignar adjunto entre OV (REQ-361)", () => {
  beforeEach(() => {
    hermanasSimuladas = HERMANAS_PARTIDO;
  });

  it("muestra el panel con correo partido, por confirmar y adjuntos guardados", () => {
    pintarReasignable();

    expect(screen.getByTestId("panel-mover")).toHaveTextContent("ov-1:2");
  });

  it("no muestra el panel si la OV ya no está por confirmar", () => {
    pintarReasignable({ estado: "confirmada" });

    expect(screen.queryByTestId("panel-mover")).not.toBeInTheDocument();
  });

  it("no muestra el panel si el correo no se partió", () => {
    hermanasSimuladas = [];
    pintarReasignable();

    expect(screen.queryByTestId("panel-mover")).not.toBeInTheDocument();
  });

  it("no muestra el panel si no hay adjuntos guardados", () => {
    pintarReasignable({ guardados: [] });

    expect(screen.queryByTestId("panel-mover")).not.toBeInTheDocument();
  });

  it("al mover un adjunto lo oculta del bloque de adjuntos y del panel", () => {
    pintarReasignable();
    expect(screen.getByTestId("adjuntos")).toHaveAttribute(
      "data-nombres",
      "OC-140188.pdf,OC-140182.pdf",
    );

    fireEvent.click(screen.getByRole("button", { name: "mover-primero" }));

    expect(screen.getByTestId("adjuntos")).toHaveAttribute("data-nombres", "OC-140182.pdf");
    expect(screen.getByTestId("panel-mover")).toHaveTextContent("ov-1:1");
  });
});
