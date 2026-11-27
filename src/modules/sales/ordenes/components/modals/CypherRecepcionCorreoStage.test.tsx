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
      <span data-testid="propias">
        {adjuntos.filter((a) => esDeEstaOv?.(a)).map((a) => a.nombre).join(",")}
      </span>
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

describe("CypherRecepcionCorreoStage: OC de esta OV con nombre mal puesto (REQ-404)", () => {
  // OV-00002635 (OC 4503002534): el PDF …535 dice 534 por dentro; el …532 es de OV-00002636.
  const ADJUNTOS_REQ_404 = [
    { nombre: "AGUACATES DE PUEBLA_4503002535_AVA.pdf", path: "cuenta/aaa-535.pdf" },
    { nombre: "AGUACATES DE PUEBLA_4503002532_AVA.pdf", path: "cuenta/aaa-532.pdf" },
  ];
  const ORDEN_REQ_404 = { ...orden, id_orden_venta: "ov-2635", orden_compra_hotel: "4503002534" } as OrdenVentaDetalleRow;

  function pintarReq404() {
    return render(
      <CypherRecepcionCorreoStage
        openStages={new Set(["correo"])}
        toggleAccordionStage={vi.fn()}
        correoChrome={{}}
        origenNombres={[]}
        recibida=""
        cuerpoCompleto=""
        cuerpoMensaje=""
        origenAdjuntosStored={ADJUNTOS_REQ_404}
        emlInnerAdjuntos={[]}
        emlInnerLoading={false}
        origenAdjuntos={ADJUNTOS_REQ_404}
        orden={ORDEN_REQ_404}
        codigoCuenta="1YW43"
      />,
    );
  }

  it("con las OC de las hermanas conocidas marca solo el PDF de esta OV, aunque su nombre esté mal", () => {
    hermanasSimuladas = [
      { idOrdenVenta: "ov-2635", codigo: "OV-00002635", ordenCompra: "4503002534" },
      { idOrdenVenta: "ov-2636", codigo: "OV-00002636", ordenCompra: "4503002532" },
    ];

    pintarReq404();

    expect(screen.getByTestId("propias")).toHaveTextContent("AGUACATES DE PUEBLA_4503002535_AVA.pdf");
    expect(screen.getByTestId("propias")).not.toHaveTextContent("4503002532");
  });

  it("si una hermana no tiene OC conocida, no marca por exclusión: ningún PDF se marca con nombre mal puesto", () => {
    hermanasSimuladas = [
      { idOrdenVenta: "ov-2635", codigo: "OV-00002635", ordenCompra: "4503002534" },
      { idOrdenVenta: "ov-2636", codigo: "OV-00002636", ordenCompra: null },
    ];

    pintarReq404();

    expect(screen.getByTestId("propias").textContent).toBe("");
  });

  it("si el nombre sí trae la OC de esta OV, la marca aunque una hermana no tenga OC conocida", () => {
    hermanasSimuladas = [
      { idOrdenVenta: "ov-2635", codigo: "OV-00002635", ordenCompra: "4503002534" },
      { idOrdenVenta: "ov-2636", codigo: "OV-00002636", ordenCompra: null },
    ];
    const adjuntos = [{ nombre: "AGUACATES_4503002534.pdf", path: "cuenta/aaa-534.pdf" }, ...ADJUNTOS_REQ_404];

    render(
      <CypherRecepcionCorreoStage
        openStages={new Set(["correo"])}
        toggleAccordionStage={vi.fn()}
        correoChrome={{}}
        origenNombres={[]}
        recibida=""
        cuerpoCompleto=""
        cuerpoMensaje=""
        origenAdjuntosStored={adjuntos}
        emlInnerAdjuntos={[]}
        emlInnerLoading={false}
        origenAdjuntos={adjuntos}
        orden={ORDEN_REQ_404}
        codigoCuenta="1YW43"
      />,
    );

    expect(screen.getByTestId("propias").textContent).toBe("AGUACATES_4503002534.pdf");
  });
});
