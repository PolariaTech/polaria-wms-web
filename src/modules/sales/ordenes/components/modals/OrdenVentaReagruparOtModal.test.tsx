import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ReagrupacionApiError,
  type RespuestaReagrupacion,
} from "../../services/reagrupar-ot.client";
import {
  PropuestaInvalidaError,
  type EstadoBaseApi,
  type PropuestaReagrupacionApi,
} from "../../utils/ot/reagrupar-ordenes-trabajo";
import {
  OrdenVentaReagruparOtModal,
  type OrdenVentaReagruparOtModalProps,
} from "./OrdenVentaReagruparOtModal";

const estadoBase = (producto = "PAPAYA"): EstadoBaseApi => ({
  ots: [
    {
      otId: "ot-comedor",
      etiqueta: "PO-1 — COMEDOR",
      almacen: "COMEDOR",
      numeroPedido: "PO-1",
      renglones: [{ renglonId: "renglon-0-0", producto: "AGUACATE", cantidad: 25 }],
    },
    {
      otId: "ot-banquetes",
      etiqueta: "PO-2 — BANQUETES",
      almacen: "BANQUETES",
      numeroPedido: "PO-2",
      renglones: [{ renglonId: "renglon-1-0", producto, cantidad: 10 }],
    },
  ],
});

const propuesta: PropuestaReagrupacionApi = {
  propuestaId: "prop-1",
  baseHash: "hash",
  ots: [
    { otId: "ot-comedor", nuevaClave: null, etiquetaSugerida: null, renglonIds: ["renglon-0-0", "renglon-1-0"] },
  ],
  resumen: { antes: 5, despues: 3, nuevas: 0, vacias: 2 },
  movimientos: [{ renglonId: "renglon-1-0", deOtId: "ot-banquetes", aOtId: "ot-comedor" }],
};

const respuestaPropuesta: RespuestaReagrupacion = { tipo: "propuesta", propuesta };

/** Promesa controlable desde la prueba. */
function diferida<T>() {
  let resolver!: (valor: T) => void;
  let rechazar!: (error: unknown) => void;
  const promesa = new Promise<T>((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

function montar(extra: Partial<OrdenVentaReagruparOtModalProps> = {}) {
  const props: OrdenVentaReagruparOtModalProps = {
    open: true,
    idOrdenVenta: "ov-1",
    folio: "OV-00000003",
    onClose: vi.fn(),
    obtenerSolicitud: vi.fn(() => ({ estadoBase: estadoBase(), firma: "firma-1" })),
    onAplicar: vi.fn(),
    solicitarPropuesta: vi.fn().mockResolvedValue(respuestaPropuesta),
    generarRequestId: (() => {
      let n = 0;
      return () => `req-${++n}`;
    })(),
    ...extra,
  };
  const vista = render(<OrdenVentaReagruparOtModal {...props} />);
  return { props, ...vista };
}

async function escribirYGenerar(texto = "Junta las OT") {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText("Instrucción"), texto);
  await usuario.click(screen.getByRole("button", { name: "Generar" }));
  return usuario;
}

describe("OrdenVentaReagruparOtModal", () => {
  it("muestra el folio y deja Generar deshabilitado hasta escribir una instrucción", async () => {
    montar();

    expect(screen.getByText("Orden de venta OV-00000003")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reorganizar órdenes de trabajo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar" })).toBeDisabled();

    await userEvent.setup().type(screen.getByLabelText("Instrucción"), "Junta");
    expect(screen.getByRole("button", { name: "Generar" })).toBeEnabled();
  });

  it("deshabilita Generar y explica el motivo cuando la instrucción pasa de 4000 caracteres", () => {
    montar();
    const campo = screen.getByLabelText("Instrucción");

    fireEvent.change(campo, { target: { value: "a".repeat(4000) } });
    expect(screen.getByRole("button", { name: "Generar" })).toBeEnabled();
    expect(screen.queryByText(/supera los 4000 caracteres/)).not.toBeInTheDocument();

    fireEvent.change(campo, { target: { value: "a".repeat(4001) } });
    expect(screen.getByRole("button", { name: "Generar" })).toBeDisabled();
    expect(screen.getByText(/supera los 4000 caracteres/)).toBeInTheDocument();
  });

  it("Nivel 2: Tab recorre Instrucción → Cancelar → Generar, y salta Generar mientras está deshabilitado", async () => {
    montar();
    const usuario = userEvent.setup();
    const campo = screen.getByLabelText("Instrucción");
    const cancelar = screen.getByRole("button", { name: "Cancelar" });
    const generar = screen.getByRole("button", { name: "Generar" });

    campo.focus();
    await usuario.tab();
    expect(cancelar).toHaveFocus();
    await usuario.tab();
    expect(generar).not.toHaveFocus();

    await usuario.click(campo);
    await usuario.type(campo, "Junta");
    await usuario.tab();
    expect(cancelar).toHaveFocus();
    await usuario.tab();
    expect(generar).toHaveFocus();
  });

  it("R2: usa el modal compartido en dock-left y nivel base (z-100), para que Cypher (z-110) quede visible", () => {
    montar();

    const contenedor = screen.getByRole("dialog").parentElement!;
    expect(contenedor.className).toContain("z-[100]");
    expect(contenedor.className).not.toContain("z-[110]");
    expect(contenedor.className).toContain("pt-[var(--polaria-shell-top");
  });

  it("CA4: genera y muestra la alerta '5 OT → 3 OT' con Confirmar y Rechazar", async () => {
    const { props } = montar();

    await escribirYGenerar("Junta las OT de comedor y banquetes");

    expect(await screen.findByText("5 OT → 3 OT")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
    expect(screen.getByText(/PO-2 — BANQUETES → PO-1 — COMEDOR/)).toBeInTheDocument();

    expect(props.solicitarPropuesta).toHaveBeenCalledTimes(1);
    expect(props.solicitarPropuesta).toHaveBeenCalledWith(
      expect.objectContaining({
        idOrdenVenta: "ov-1",
        instruccion: "Junta las OT de comedor y banquetes",
        historial: [],
        estadoBase: estadoBase(),
      }),
    );
  });

  it("el resumen usa singular y plural correctos", async () => {
    const solicitarPropuesta = vi.fn().mockResolvedValue({
      tipo: "propuesta",
      propuesta: {
        ...propuesta,
        resumen: { antes: 4, despues: 4, nuevas: 1, vacias: 1 },
      },
    });
    montar({ solicitarPropuesta });

    await escribirYGenerar("Junta las OT");

    expect(await screen.findByText(/Se crea 1 OT nueva\. Se une 1 OT que queda sin renglones\./)).toBeInTheDocument();
  });

  it("CA5: un doble clic en Generar envía una sola petición", async () => {
    const espera = diferida<RespuestaReagrupacion>();
    const { props } = montar({ solicitarPropuesta: vi.fn(() => espera.promesa) });
    const usuario = userEvent.setup();
    await usuario.type(screen.getByLabelText("Instrucción"), "Junta");

    await usuario.dblClick(screen.getByRole("button", { name: "Generar" }));

    expect(props.solicitarPropuesta).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Generando propuesta…")).toBeInTheDocument();
    expect(screen.getByLabelText("Instrucción")).toHaveAttribute("readonly");
    act(() => espera.resolver(respuestaPropuesta));
    await screen.findByText("5 OT → 3 OT");
  });

  it("CA10: nada se aplica hasta pulsar Confirmar", async () => {
    const { props } = montar();

    await escribirYGenerar("Junta las OT");
    await screen.findByText("5 OT → 3 OT");
    expect(props.onAplicar).not.toHaveBeenCalled();

    await userEvent.setup().click(screen.getByRole("button", { name: "Confirmar" }));

    expect(props.onAplicar).toHaveBeenCalledTimes(1);
    expect(props.onAplicar).toHaveBeenCalledWith({
      propuesta,
      instruccion: "Junta las OT",
    });
  });

  it("Rechazar permite refinar: el historial viaja en la siguiente petición", async () => {
    const { props } = montar();
    const usuario = await escribirYGenerar("Junta todas las OT");
    await screen.findByText("5 OT → 3 OT");

    await usuario.click(screen.getByRole("button", { name: "Rechazar" }));

    expect(screen.queryByText("5 OT → 3 OT")).not.toBeInTheDocument();
    expect(screen.getByText("Junta todas las OT")).toBeInTheDocument(); // intentos anteriores
    expect(screen.getByLabelText("Instrucción")).toHaveValue("");

    await usuario.type(screen.getByLabelText("Instrucción"), "deja la de spa aparte");
    await usuario.click(screen.getByRole("button", { name: "Generar" }));

    await waitFor(() => expect(props.solicitarPropuesta).toHaveBeenCalledTimes(2));
    expect(props.solicitarPropuesta).toHaveBeenLastCalledWith(
      expect.objectContaining({
        instruccion: "deja la de spa aparte",
        historial: ["Junta todas las OT"],
      }),
    );
  });

  it("CA6: si se cambia de OV mientras genera, la respuesta tardía se descarta y se aborta la petición", async () => {
    const espera = diferida<RespuestaReagrupacion>();
    let senal: AbortSignal | undefined;
    const solicitarPropuesta = vi.fn(({ signal }: { signal?: AbortSignal }) => {
      senal = signal;
      return espera.promesa;
    });
    const { props, rerender } = montar({
      solicitarPropuesta: solicitarPropuesta as unknown as OrdenVentaReagruparOtModalProps["solicitarPropuesta"],
    });
    const usuario = userEvent.setup();
    await usuario.type(screen.getByLabelText("Instrucción"), "Junta las OT");
    await usuario.click(screen.getByRole("button", { name: "Generar" }));
    expect(solicitarPropuesta).toHaveBeenCalledTimes(1);

    // El usuario abre otra OV.
    rerender(<OrdenVentaReagruparOtModal {...props} idOrdenVenta="ov-2" />);
    expect(senal?.aborted).toBe(true);

    // La respuesta de la OV 1 llega tarde.
    await act(async () => {
      espera.resolver(respuestaPropuesta);
      await espera.promesa;
    });

    expect(screen.queryByText("5 OT → 3 OT")).not.toBeInTheDocument();
    expect(props.onAplicar).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Instrucción")).toHaveValue("");
  });

  it("al cerrar el modal mientras genera se aborta la petición y al reabrir queda limpio", async () => {
    const espera = diferida<RespuestaReagrupacion>();
    let senal: AbortSignal | undefined;
    const { props, rerender } = montar({
      solicitarPropuesta: vi.fn(({ signal }: { signal?: AbortSignal }) => {
        senal = signal;
        return espera.promesa;
      }) as unknown as OrdenVentaReagruparOtModalProps["solicitarPropuesta"],
    });
    const usuario = userEvent.setup();
    await usuario.type(screen.getByLabelText("Instrucción"), "Junta las OT");
    await usuario.click(screen.getByRole("button", { name: "Generar" }));

    rerender(<OrdenVentaReagruparOtModal {...props} open={false} />);
    expect(senal?.aborted).toBe(true);

    rerender(<OrdenVentaReagruparOtModal {...props} open />);
    expect(screen.getByLabelText("Instrucción")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Generar" })).toBeDisabled();
  });

  it("Cancelar mientras genera aborta la petición, conserva el texto y descarta la respuesta tardía", async () => {
    const espera = diferida<RespuestaReagrupacion>();
    let senal: AbortSignal | undefined;
    const { props } = montar({
      solicitarPropuesta: vi.fn(({ signal }: { signal?: AbortSignal }) => {
        senal = signal;
        return espera.promesa;
      }) as unknown as OrdenVentaReagruparOtModalProps["solicitarPropuesta"],
    });
    const usuario = await escribirYGenerar("Junta las OT");

    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(senal?.aborted).toBe(true);
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Instrucción")).toHaveValue("Junta las OT");
    await act(async () => {
      espera.resolver(respuestaPropuesta);
      await espera.promesa;
    });
    expect(screen.queryByText("5 OT → 3 OT")).not.toBeInTheDocument();
  });

  it("un error muestra el mensaje, conserva el texto y permite reintentar", async () => {
    const solicitarPropuesta = vi
      .fn()
      .mockRejectedValueOnce(
        new ReagrupacionApiError("No se pudo consultar a la IA. Intenta de nuevo.", "PROVEEDOR_IA", 502),
      )
      .mockResolvedValueOnce(respuestaPropuesta);
    montar({ solicitarPropuesta });
    const usuario = await escribirYGenerar("Junta las OT");

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo consultar a la IA. Intenta de nuevo.");
    expect(screen.getByLabelText("Instrucción")).toHaveValue("Junta las OT");

    await usuario.click(screen.getByRole("button", { name: "Generar" }));
    expect(await screen.findByText("5 OT → 3 OT")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra la aclaración y el rechazo del modelo como avisos", async () => {
    const solicitarPropuesta = vi
      .fn()
      .mockResolvedValueOnce({ tipo: "aclaracion", mensaje: "No quedó claro cómo reorganizar." })
      .mockResolvedValueOnce({ tipo: "rechazo" });
    montar({ solicitarPropuesta });
    const usuario = await escribirYGenerar("arréglalas");

    expect(await screen.findByRole("status")).toHaveTextContent("No quedó claro cómo reorganizar.");

    await usuario.click(screen.getByRole("button", { name: "Generar" }));
    expect(await screen.findByText(/No puedo cambiar cantidades ni datos del pedido/)).toBeInTheDocument();
  });

  it("CA12: el texto que viene del correo se muestra como texto, nunca como HTML", async () => {
    montar({
      obtenerSolicitud: vi.fn(() => ({
        estadoBase: estadoBase("<img src=x onerror=alert(1)>"),
        firma: "firma-1",
      })),
    });

    await escribirYGenerar("Junta las OT");
    await screen.findByText("5 OT → 3 OT");

    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("si el formulario cambió mientras se generaba, Confirmar no aplica y pide volver a generar", async () => {
    const obtenerSolicitud = vi
      .fn()
      .mockReturnValueOnce({ estadoBase: estadoBase(), firma: "firma-1" })
      .mockReturnValue({ estadoBase: estadoBase(), firma: "firma-OTRA" });
    const { props } = montar({ obtenerSolicitud });
    const usuario = await escribirYGenerar("Junta las OT");
    await screen.findByText("5 OT → 3 OT");

    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(props.onAplicar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("El formulario cambió mientras se generaba la propuesta");
    expect(screen.getByLabelText("Instrucción")).toHaveValue("Junta las OT");
  });

  it("si aplicar lanza una propuesta inválida, la descarta con un mensaje claro", async () => {
    const onAplicar = vi.fn(() => {
      throw new PropuestaInvalidaError("RENGLONES_NO_COINCIDEN");
    });
    montar({ onAplicar });
    const usuario = await escribirYGenerar("Junta las OT");
    await screen.findByText("5 OT → 3 OT");

    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("fue descartada");
    expect(screen.queryByText("5 OT → 3 OT")).not.toBeInTheDocument();
  });

  it("CA13 (parcial): Escape cierra solo este modal y no llega al formulario de debajo", () => {
    const { props } = montar();
    const formularioDeDebajo = vi.fn();
    document.addEventListener("keydown", formularioDeDebajo);

    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(formularioDeDebajo).not.toHaveBeenCalled();
    document.removeEventListener("keydown", formularioDeDebajo);
  });

  it("no hace nada con Escape cuando está cerrado", () => {
    const { props } = montar({ open: false });

    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(props.onClose).not.toHaveBeenCalled();
  });
});
