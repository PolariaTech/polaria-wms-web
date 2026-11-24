import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CorreccionCorreoApiError } from "../../services/correccion-correo.client";
import { type RespuestaReagrupacion } from "../../services/reagrupar-ot.client";
import { type OrdenVentaReagruparOtModalProps } from "./OrdenVentaReagruparOtModal";

import { estadoBase, respuestaPropuesta, diferida, montar, escribirYGenerar, cancelarConfirmando } from "./OrdenVentaReagruparOtModal.test-helpers";

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
    expect(screen.getByText("Este proceso puede tardar unos segundos.")).toBeInTheDocument();
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
    expect(screen.getByText("Este proceso puede tardar unos segundos.")).toBeInTheDocument();
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

});
