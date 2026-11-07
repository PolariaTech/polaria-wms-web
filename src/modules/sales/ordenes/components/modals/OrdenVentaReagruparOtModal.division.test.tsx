import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ReagrupacionApiError,
  type DivisionReagrupacionApi,
  type RespuestaReagrupacion,
} from "../../services/reagrupar-ot.client";
import {
  OrdenVentaReagruparOtModal,
  type OrdenVentaReagruparOtModalProps,
} from "./OrdenVentaReagruparOtModal";

const division: DivisionReagrupacionApi = {
  criterio: "oc",
  valoresSalen: ["4502988746"],
  valoresQuedan: ["4502988065"],
  otIdsQueSalen: ["ot-2"],
};
const respuestaDivision: RespuestaReagrupacion = { tipo: "division", division };

const estadoBase = {
  ots: [
    {
      otId: "ot-1",
      etiqueta: "4502988065 — COCINA",
      almacen: "COCINA",
      numeroPedido: "4502988065",
      renglones: [{ renglonId: "renglon-0-0", producto: "AGUACATE", cantidad: 10 }],
    },
    {
      otId: "ot-2",
      etiqueta: "4502988746 — COCINA",
      almacen: "COCINA",
      numeroPedido: "4502988746",
      renglones: [{ renglonId: "renglon-1-0", producto: "LIMON", cantidad: 8 }],
    },
  ],
};

function montar(extra: Partial<OrdenVentaReagruparOtModalProps> = {}) {
  const props: OrdenVentaReagruparOtModalProps = {
    open: true,
    idOrdenVenta: "ov-1",
    folio: "OV-00000003",
    onClose: vi.fn(),
    obtenerSolicitud: vi.fn(() => ({ estadoBase, firma: "firma-1" })),
    onAplicar: vi.fn(),
    onDividir: vi.fn().mockResolvedValue(undefined),
    solicitarPropuesta: vi.fn().mockResolvedValue(respuestaDivision),
    generarRequestId: () => "req-1",
    ...extra,
  };
  render(<OrdenVentaReagruparOtModal {...props} />);
  return props;
}

async function generarPlan() {
  const usuario = userEvent.setup();
  await usuario.type(
    screen.getByLabelText("Instrucción"),
    "Crea dos pedidos, uno por cada orden de compra",
  );
  await usuario.click(screen.getByRole("button", { name: "Generar" }));
  await screen.findByRole("heading", { name: "La orden se divide en 2 órdenes de venta" });
  return usuario;
}

describe("OrdenVentaReagruparOtModal — dividir la orden de venta (REQ-262, REQ-273)", () => {
  it("muestra el plan con Confirmar y Rechazar, sin aplicar nada todavía", async () => {
    const props = montar();

    await generarPlan();

    expect(screen.getByText("Orden de compra 4502988065")).toBeInTheDocument();
    expect(screen.getByText("Orden de compra 4502988746")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
    expect(props.onDividir).not.toHaveBeenCalled();
    expect(props.onAplicar).not.toHaveBeenCalled();
  });

  it("Confirmar divide solo con la división y no usa la reorganización de tareas", async () => {
    const props = montar();
    const usuario = await generarPlan();

    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(props.onDividir).toHaveBeenCalledTimes(1));
    expect(props.onDividir).toHaveBeenCalledWith(division);
    expect(props.onAplicar).not.toHaveBeenCalled();
  });

  it("mientras divide bloquea Confirmar y Rechazar, y un segundo clic no divide dos veces", async () => {
    let terminar!: () => void;
    const onDividir = vi.fn(
      () =>
        new Promise<void>((resolver) => {
          terminar = resolver;
        }),
    );
    montar({ onDividir });
    const usuario = await generarPlan();

    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    const dividiendo = await screen.findByRole("button", { name: "Dividiendo…" });
    expect(dividiendo).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeDisabled();
    await usuario.click(dividiendo);
    expect(onDividir).toHaveBeenCalledTimes(1);
    terminar();
  });

  it("si dividir falla muestra qué pasó, sin códigos internos, y permite volver a generar", async () => {
    const onDividir = vi
      .fn()
      .mockRejectedValue(
        new ReagrupacionApiError("Esta orden ya no está por confirmar.", "OV_ESTADO_CAMBIO", 409),
      );
    montar({ onDividir });
    const usuario = await generarPlan();

    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Esta orden ya no está por confirmar.",
    );
    expect(screen.queryByText(/OV_ESTADO_CAMBIO/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /se divide en/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar" })).toBeInTheDocument();
  });

  it("un error que no es de la API se informa con un mensaje claro", async () => {
    montar({ onDividir: vi.fn().mockRejectedValue(new Error("boom interno")) });
    const usuario = await generarPlan();

    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo dividir la orden. Intenta de nuevo.",
    );
    expect(screen.queryByText(/boom interno/)).not.toBeInTheDocument();
  });

  it("si el formulario cambió mientras se generaba el plan, no divide y pide volver a generar", async () => {
    const obtenerSolicitud = vi
      .fn()
      .mockReturnValueOnce({ estadoBase, firma: "firma-1" })
      .mockReturnValue({ estadoBase, firma: "firma-2" });
    const props = montar({ obtenerSolicitud });
    const usuario = await generarPlan();

    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/El formulario cambió/);
    expect(props.onDividir).not.toHaveBeenCalled();
  });

  it("sin onDividir no se ofrece confirmar la división", async () => {
    montar({ onDividir: undefined });
    await generarPlan();

    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
  });

  it("Rechazar vuelve a escribir y guarda la instrucción en el historial", async () => {
    const props = montar();
    const usuario = await generarPlan();

    await usuario.click(screen.getByRole("button", { name: "Rechazar" }));

    expect(screen.getByLabelText("Instrucción")).toHaveValue("");
    expect(screen.getByText("Crea dos pedidos, uno por cada orden de compra")).toBeInTheDocument();
    expect(props.onDividir).not.toHaveBeenCalled();
  });
});
