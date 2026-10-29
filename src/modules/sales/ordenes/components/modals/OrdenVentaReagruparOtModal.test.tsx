import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CorreccionCorreoApiError } from "../../services/correccion-correo.client";
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

/** Cancelar un proceso de la IA pide confirmación: «Cancelar» → «Sí, cancelar». */
async function cancelarConfirmando(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
  await usuario.click(screen.getByRole("button", { name: "Sí, cancelar" }));
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
    expect(screen.getByText("Reorganizando las órdenes de trabajo…")).toBeInTheDocument();
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

    await cancelarConfirmando(usuario);

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
    expect(document.querySelectorAll('img:not([src^="data:image/svg+xml;charset=utf-8,%3Csvg"])')).toHaveLength(0);
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

describe("OrdenVentaReagruparOtModal — un solo «Generar» que decide la función (REQ-187)", () => {
  const propuestaCorreccion = {
    requestId: "req-1",
    propuestaId: "prop-c",
    baseHash: "h",
    documentos: [
      {
        nombre: "AGUACATES_4502987208.pdf",
        oc: "4502987208",
        ocFuente: "ambas" as const,
        renglones: 82,
        verificacion: { totalDocumento: 11500.6, importe: 11500.6, diferencia: 0, cuadra: true },
        relecturaPorBloques: false,
      },
    ],
    ots: [
      {
        id: "pedido:4502987208|almacen:abar",
        etiqueta: "4502987208 — ABAR",
        numeroPedido: "4502987208",
        almacen: "ABAR",
        totalCantidad: 2,
        renglones: [{ Producto: "AGUACATE", Cantidad: 2 }],
      },
    ],
    resumen: {
      otAntes: 6,
      otDespues: 12,
      renglonesAntes: 60,
      renglonesDespues: 82,
      importeAntes: 100,
      importeDespues: 11500.6,
    },
    diff: { otNuevas: ["a"], otEliminadas: [], renglonesAgregados: 22, renglonesQuitados: 0 },
    advertencias: [],
  };

  const releer = {
    intencion: "releer_documentos" as const,
    motivo: "Pide verificar contra la factura.",
    expectativas: { totalOt: 21, importeTotal: 27905.25 },
    porReglas: false,
  };
  const reorganizar = {
    intencion: "reorganizar" as const,
    motivo: "Pide juntar órdenes que ya existen.",
    expectativas: {},
    porReglas: false,
  };

  function montarConCorreccion(extra: Partial<OrdenVentaReagruparOtModalProps> = {}) {
    return montar({
      onAplicarCorreccion: vi.fn(),
      interpretar: vi.fn().mockResolvedValue(releer),
      solicitarCorreccion: vi.fn().mockResolvedValue(propuestaCorreccion),
      ...extra,
    });
  }

  it("la instrucción ocupa todo el ancho del modal, sin tope de lectura", () => {
    montarConCorreccion();

    const contenedor = screen.getByLabelText("Instrucción").closest(".flex-1")!;
    expect(contenedor.className).toContain("w-full");
    expect(contenedor.className).not.toMatch(/max-w-/);
  });

  it("Polo solo aparece en la capa de carga: no hay ninguna ilustración en el formulario en reposo", () => {
    montarConCorreccion();

    expect(document.querySelectorAll("img")).toHaveLength(0);
  });

  it("el texto de la instrucción es legible: 16 px, y 17 px en pantallas grandes", () => {
    montarConCorreccion();

    const campo = screen.getByLabelText("Instrucción");
    expect(campo.className).toContain("text-base");
    expect(campo.className).toContain("lg:text-[1.0625rem]");
    expect(campo.className).not.toContain("polaria-text-body-sm");
  });

  it("no hay segundo botón: solo «Generar»", () => {
    montarConCorreccion();

    expect(screen.getByRole("button", { name: "Generar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Releer correo/ })).not.toBeInTheDocument();
  });

  it("sin onAplicarCorreccion «Generar» no interpreta: reorganiza como siempre", async () => {
    const interpretar = vi.fn();
    const { props } = montar({ interpretar });

    await escribirYGenerar();

    expect(interpretar).not.toHaveBeenCalled();
    expect(props.solicitarPropuesta).toHaveBeenCalledTimes(1);
  });

  it("si la instrucción pide mover renglones existentes usa el chat de siempre", async () => {
    const { props } = montarConCorreccion({ interpretar: vi.fn().mockResolvedValue(reorganizar) });

    await escribirYGenerar("Junta comedor y bares");

    expect(props.interpretar).toHaveBeenCalledWith(
      expect.objectContaining({ idOrdenVenta: "ov-1", instruccion: "Junta comedor y bares" }),
    );
    expect(props.solicitarPropuesta).toHaveBeenCalledTimes(1);
    expect(props.solicitarCorreccion).not.toHaveBeenCalled();
    expect(await screen.findByText("5 OT → 3 OT")).toBeInTheDocument();
  });

  it("si pide corregir contra los documentos relee el correo con lo que el usuario esperaba y muestra la propuesta", async () => {
    const { props } = montarConCorreccion();

    await escribirYGenerar("El total de la factura es 27,905.25 y deben ser 21 OT");

    expect(await screen.findByText("6 OT → 12 OT")).toBeInTheDocument();
    expect(props.solicitarCorreccion).toHaveBeenCalledWith(
      expect.objectContaining({
        idOrdenVenta: "ov-1",
        instruccion: "El total de la factura es 27,905.25 y deben ser 21 OT",
        expectativas: { totalOt: 21, importeTotal: 27905.25 },
      }),
    );
    expect(props.solicitarPropuesta).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Corregir con el correo" })).toBeInTheDocument();
    expect(screen.getByText("Pide verificar contra la factura.")).toBeInTheDocument();
  });

  it("mientras interpreta y mientras relee muestra a Polo con el texto y el tiempo estimado de cada etapa", async () => {
    const interpretacion = diferida<typeof releer>();
    const correccion = diferida<typeof propuestaCorreccion>();
    montarConCorreccion({
      interpretar: vi.fn().mockReturnValue(interpretacion.promesa),
      solicitarCorreccion: vi.fn().mockReturnValue(correccion.promesa),
    });

    await escribirYGenerar();

    expect(screen.getByText("Entendiendo tu instrucción…")).toBeInTheDocument();
    expect(screen.getByText("Este proceso puede tardar entre 2 y 10 segundos.")).toBeInTheDocument();
    expect(document.querySelector('img[src^="data:image/svg+xml"]')).not.toBeNull();

    await act(async () => interpretacion.resolver(releer));

    expect(await screen.findByText("Releyendo el correo y los archivos…")).toBeInTheDocument();
    expect(screen.getByText("Pide verificar contra la factura.")).toBeInTheDocument();
    expect(screen.getByText("Este proceso puede tardar entre 1 y 3 minutos.")).toBeInTheDocument();

    await act(async () => correccion.resolver(propuestaCorreccion));
    expect(await screen.findByText("6 OT → 12 OT")).toBeInTheDocument();
  });

  it("al reorganizar también muestra a Polo con su propio rango", async () => {
    const respuesta = diferida<RespuestaReagrupacion>();
    montarConCorreccion({
      interpretar: vi.fn().mockResolvedValue(reorganizar),
      solicitarPropuesta: vi.fn().mockReturnValue(respuesta.promesa),
    });

    await escribirYGenerar();

    expect(await screen.findByText("Reorganizando las órdenes de trabajo…")).toBeInTheDocument();
    expect(screen.getByText("Este proceso puede tardar entre 5 y 30 segundos.")).toBeInTheDocument();
    await act(async () => respuesta.resolver(respuestaPropuesta));
  });

  it("si no se puede interpretar, «Generar» sigue como siempre (reorganizar)", async () => {
    const { props } = montarConCorreccion({ interpretar: vi.fn().mockRejectedValue(new Error("caído")) });

    await escribirYGenerar();

    expect(props.solicitarPropuesta).toHaveBeenCalledTimes(1);
    expect(props.solicitarCorreccion).not.toHaveBeenCalled();
  });

  it("aplicar entrega la corrección si el formulario no cambió", async () => {
    const usuario = await escribirYGenerarConCorreccion();

    await usuario.click(await screen.findByRole("button", { name: /Aplicar al borrador/ }));

    expect(usuario.props.onAplicarCorreccion).toHaveBeenCalledWith(
      expect.objectContaining({ propuestaId: "prop-c" }),
    );
  });

  it("si el formulario cambió mientras se releía, no aplica y avisa", async () => {
    // La 1.ª lectura (al generar) da firma-1; al aplicar el formulario ya es otro.
    const firmas = ["firma-1"];
    const obtenerSolicitud = vi.fn(() => ({
      estadoBase: estadoBase(),
      firma: firmas.shift() ?? "firma-2",
    }));
    const usuario = await escribirYGenerarConCorreccion({ obtenerSolicitud });

    await usuario.click(await screen.findByRole("button", { name: /Aplicar al borrador/ }));

    expect(usuario.props.onAplicarCorreccion).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/formulario cambió/);
    expect(screen.getByLabelText("Instrucción")).toBeInTheDocument();
  });

  it("descartar vuelve a la instrucción conservando lo escrito", async () => {
    const usuario = await escribirYGenerarConCorreccion();

    await usuario.click(await screen.findByRole("button", { name: "Descartar" }));

    expect(screen.getByRole("heading", { name: "Reorganizar órdenes de trabajo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Instrucción")).toHaveValue("Junta las OT");
  });

  it("un error de la relectura se muestra, no pierde la instrucción y permite reintentar", async () => {
    const solicitarCorreccion = vi
      .fn()
      .mockRejectedValueOnce(
        new CorreccionCorreoApiError("La relectura no coincide con el total.", "RELECTURA_NO_CUADRA", 422),
      )
      .mockResolvedValueOnce(propuestaCorreccion);
    const usuario = await escribirYGenerarConCorreccion({ solicitarCorreccion }, false);

    expect((await screen.findByRole("alert")).textContent).toContain("La relectura no coincide");
    expect(screen.getByLabelText("Instrucción")).toHaveValue("Junta las OT");

    await usuario.click(screen.getByRole("button", { name: "Generar" }));
    expect(await screen.findByText("6 OT → 12 OT")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("un error desconocido no filtra detalles", async () => {
    await escribirYGenerarConCorreccion(
      { solicitarCorreccion: vi.fn().mockRejectedValue(new Error("password authentication failed")) },
      false,
    );
    expect((await screen.findByRole("alert")).textContent).not.toContain("password");
  });

  it("cancelar mientras relee aborta la petición y vuelve a la instrucción", async () => {
    const usuario = userEvent.setup();
    let senal: AbortSignal | undefined;
    const solicitarCorreccion = vi.fn().mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise((_, rechazar) => {
          senal = signal;
          signal.addEventListener("abort", () => rechazar(new DOMException("cancelado", "AbortError")));
        }),
    );
    montarConCorreccion({ solicitarCorreccion });
    await usuario.type(screen.getByLabelText("Instrucción"), "Junta las OT");
    await usuario.click(screen.getByRole("button", { name: "Generar" }));
    await screen.findByText("Releyendo el correo y los archivos…");

    await cancelarConfirmando(usuario);

    expect(senal?.aborted).toBe(true);
    await waitFor(() => expect(screen.queryByText("Releyendo el correo y los archivos…")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Generar" })).toBeEnabled();
    expect(screen.getByLabelText("Instrucción")).toHaveValue("Junta las OT");
  });

  it("Escape con la capa de carga abierta pide confirmar: no cancela ni cierra el modal", async () => {
    const usuario = userEvent.setup();
    let senal: AbortSignal | undefined;
    const solicitarCorreccion = vi.fn().mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise((_, rechazar) => {
          senal = signal;
          signal.addEventListener("abort", () => rechazar(new DOMException("cancelado", "AbortError")));
        }),
    );
    const { props } = montarConCorreccion({ solicitarCorreccion });
    await usuario.type(screen.getByLabelText("Instrucción"), "Junta las OT");
    await usuario.click(screen.getByRole("button", { name: "Generar" }));
    await screen.findByText("Releyendo el correo y los archivos…");

    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(await screen.findByText("¿Seguro que quieres cancelar este proceso?")).toBeInTheDocument();
    expect(senal?.aborted).toBeFalsy();
    expect(props.onClose).not.toHaveBeenCalled();

    // «Seguir esperando»: el proceso continúa.
    await usuario.click(screen.getByRole("button", { name: "Seguir esperando" }));
    expect(senal?.aborted).toBeFalsy();

    // Confirmar sí cancela, sin cerrar el modal y conservando lo escrito.
    await cancelarConfirmando(usuario);
    expect(senal?.aborted).toBe(true);
    expect(props.onClose).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /Releyendo/ })).not.toBeInTheDocument());
    expect(screen.getByLabelText("Instrucción")).toHaveValue("Junta las OT");

    // Sin carga, Escape vuelve a cerrar el modal.
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("un doble clic en «Generar» no lanza dos interpretaciones", async () => {
    const interpretacion = diferida<typeof releer>();
    const { props } = montarConCorreccion({ interpretar: vi.fn().mockReturnValue(interpretacion.promesa) });
    await userEvent.setup().type(screen.getByLabelText("Instrucción"), "Junta las OT");
    const boton = screen.getByRole("button", { name: "Generar" });

    await act(async () => {
      boton.click();
      boton.click();
    });

    expect(props.interpretar).toHaveBeenCalledTimes(1);
    await act(async () => interpretacion.resolver(releer));
  });

  it("al cerrar y reabrir vuelve a la instrucción limpia", async () => {
    const usuario = userEvent.setup();
    const props = {
      open: true,
      idOrdenVenta: "ov-1",
      onClose: vi.fn(),
      obtenerSolicitud: vi.fn(() => ({ estadoBase: estadoBase(), firma: "firma-1" })),
      onAplicar: vi.fn(),
      onAplicarCorreccion: vi.fn(),
      interpretar: vi.fn().mockResolvedValue(releer),
      solicitarCorreccion: vi.fn().mockResolvedValue(propuestaCorreccion),
    };
    const { rerender } = render(<OrdenVentaReagruparOtModal {...props} />);
    await usuario.type(screen.getByLabelText("Instrucción"), "Junta las OT");
    await usuario.click(screen.getByRole("button", { name: "Generar" }));
    await screen.findByText("6 OT → 12 OT");

    rerender(<OrdenVentaReagruparOtModal {...props} open={false} />);
    rerender(<OrdenVentaReagruparOtModal {...props} open />);

    expect(screen.getByRole("heading", { name: "Reorganizar órdenes de trabajo" })).toBeInTheDocument();
    expect(screen.queryByText("6 OT → 12 OT")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Instrucción")).toHaveValue("");
  });

  /** Escribe «Junta las OT», pulsa Generar y espera la propuesta de corrección. */
  async function escribirYGenerarConCorreccion(
    extra: Partial<OrdenVentaReagruparOtModalProps> = {},
    esperarPropuesta = true,
  ) {
    const montado = montarConCorreccion(extra);
    const usuario = userEvent.setup();
    await usuario.type(screen.getByLabelText("Instrucción"), "Junta las OT");
    await usuario.click(screen.getByRole("button", { name: "Generar" }));
    if (esperarPropuesta) await screen.findByText("6 OT → 12 OT");
    return Object.assign(usuario, { props: montado.props });
  }
});
