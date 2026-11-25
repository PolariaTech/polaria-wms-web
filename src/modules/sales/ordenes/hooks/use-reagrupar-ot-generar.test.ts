import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EstadoCorreccion } from "../components/modals/reagrupacion-modal-ui";
import { CorreccionCorreoApiError } from "../services/correccion-correo.client";
import { ReagrupacionApiError } from "../services/reagrupar-ot.client";
import {
  ESTADO_INICIAL_REAGRUPACION,
  type EstadoModalReagrupacion,
} from "../utils/ot/reagrupacion-modal-estado";
import {
  useReagruparOtGenerar,
  type UseReagruparOtGenerarArgs,
} from "./use-reagrupar-ot-generar";

const estadoBase = { ots: [] };
const solicitud = { estadoBase, firma: "firma-1" };
const estado: EstadoModalReagrupacion = {
  ...ESTADO_INICIAL_REAGRUPACION,
  instruccion: "  junta todo  ",
};

function armar(parcial: Partial<UseReagruparOtGenerarArgs> = {}) {
  const args = {
    estado,
    dispatch: vi.fn(),
    idOrdenVenta: "ov-1",
    obtenerSolicitud: vi.fn(() => solicitud),
    onAplicarCorreccion: undefined,
    solicitarPropuesta: vi.fn(),
    interpretar: vi.fn(),
    solicitarCorreccion: vi.fn(),
    generarRequestId: () => "req-1",
    controladorRef: { current: null as AbortController | null },
    enCursoRef: { current: false },
    setInterpretando: vi.fn(),
    setMotivoActual: vi.fn(),
    setCorreccion: vi.fn(),
    setErrorCorreccion: vi.fn(),
    ...parcial,
  } as unknown as UseReagruparOtGenerarArgs;
  const hook = renderHook(() => useReagruparOtGenerar(args));
  return { args, generar: () => act(() => hook.result.current()) };
}

describe("useReagruparOtGenerar", () => {
  it("no hace nada si no se puede generar (instrucción vacía)", async () => {
    const { args, generar } = armar({ estado: ESTADO_INICIAL_REAGRUPACION });
    await generar();
    expect(args.dispatch).not.toHaveBeenCalled();
    expect(args.obtenerSolicitud).not.toHaveBeenCalled();
  });

  it("ignora un segundo clic mientras hay una petición en curso", async () => {
    const { args, generar } = armar({ enCursoRef: { current: true } });
    await generar();
    expect(args.obtenerSolicitud).not.toHaveBeenCalled();
  });

  it("sin solicitud falla con «No hay órdenes de trabajo para reorganizar.» y libera el bloqueo", async () => {
    const { args, generar } = armar({ obtenerSolicitud: vi.fn(() => null) });
    await generar();
    expect(args.dispatch).toHaveBeenCalledWith({
      tipo: "GENERAR",
      requestId: "req-1",
      firmaBase: "",
    });
    expect(args.dispatch).toHaveBeenCalledWith({
      tipo: "FALLO",
      requestId: "req-1",
      mensaje: "No hay órdenes de trabajo para reorganizar.",
    });
    expect(args.enCursoRef.current).toBe(false);
  });

  it("reorganiza: pide la propuesta con la instrucción recortada y despacha RESPUESTA", async () => {
    const respuesta = { tipo: "aclaracion", mensaje: "ok" };
    const solicitarPropuesta = vi.fn().mockResolvedValue(respuesta);
    const { args, generar } = armar({ solicitarPropuesta });
    await generar();
    expect(solicitarPropuesta).toHaveBeenCalledWith(
      expect.objectContaining({
        idOrdenVenta: "ov-1",
        requestId: "req-1",
        instruccion: "junta todo",
        historial: [],
        estadoBase,
      }),
    );
    expect(args.dispatch).toHaveBeenCalledWith({
      tipo: "GENERAR",
      requestId: "req-1",
      firmaBase: "firma-1",
    });
    expect(args.dispatch).toHaveBeenCalledWith({
      tipo: "RESPUESTA",
      requestId: "req-1",
      respuesta,
      movimientos: undefined,
    });
    expect(args.enCursoRef.current).toBe(false);
    expect(args.controladorRef.current).toBeNull();
  });

  it("un ReagrupacionApiError despacha su mensaje; otro error, el genérico", async () => {
    const a = armar({
      solicitarPropuesta: vi.fn().mockRejectedValue(new ReagrupacionApiError("servidor dijo no", "x")),
    });
    await a.generar();
    expect(a.args.dispatch).toHaveBeenCalledWith({
      tipo: "FALLO",
      requestId: "req-1",
      mensaje: "servidor dijo no",
    });

    const b = armar({ solicitarPropuesta: vi.fn().mockRejectedValue(new Error("boom")) });
    await b.generar();
    expect(b.args.dispatch).toHaveBeenCalledWith({
      tipo: "FALLO",
      requestId: "req-1",
      mensaje: "No se pudo generar la propuesta. Intenta de nuevo.",
    });
  });

  it("un AbortError no despacha FALLO", async () => {
    const abort = new DOMException("abortado", "AbortError");
    const { args, generar } = armar({ solicitarPropuesta: vi.fn().mockRejectedValue(abort) });
    await generar();
    const tipos = (args.dispatch as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0].tipo);
    expect(tipos).not.toContain("FALLO");
  });

  it("con onAplicarCorreccion e intención «releer_documentos» relee el correo y deja la propuesta", async () => {
    const propuestaCorreccion = { id: "corr" };
    const interpretar = vi.fn().mockResolvedValue({
      intencion: "releer_documentos",
      motivo: "faltan productos",
      expectativas: { total: 10 },
    });
    const solicitarCorreccion = vi.fn().mockResolvedValue(propuestaCorreccion);
    const { args, generar } = armar({
      onAplicarCorreccion: vi.fn(),
      interpretar,
      solicitarCorreccion,
    });
    await generar();
    expect(args.setMotivoActual).toHaveBeenCalledWith("faltan productos");
    expect(args.setCorreccion).toHaveBeenNthCalledWith(1, {
      fase: "leyendo",
      motivo: "faltan productos",
      firmaBase: "firma-1",
    });
    expect(solicitarCorreccion).toHaveBeenCalledWith(
      expect.objectContaining({ expectativas: { total: 10 }, instruccion: "junta todo" }),
    );
    const ultimo = (args.setCorreccion as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0] as EstadoCorreccion;
    expect(ultimo).toMatchObject({ fase: "propuesta", propuesta: propuestaCorreccion });
    // No se pidió reorganizar.
    expect(args.solicitarPropuesta).not.toHaveBeenCalled();
    expect(args.enCursoRef.current).toBe(false);
  });

  it("si releer falla muestra el mensaje del CorreccionCorreoApiError o el genérico", async () => {
    const interpretar = vi.fn().mockResolvedValue({
      intencion: "releer_documentos",
      motivo: "m",
      expectativas: {},
    });
    const a = armar({
      onAplicarCorreccion: vi.fn(),
      interpretar,
      solicitarCorreccion: vi.fn().mockRejectedValue(new CorreccionCorreoApiError("no hay correo", "x")),
    });
    await a.generar();
    expect(a.args.setCorreccion).toHaveBeenLastCalledWith(null);
    expect(a.args.setErrorCorreccion).toHaveBeenLastCalledWith("no hay correo");

    const b = armar({
      onAplicarCorreccion: vi.fn(),
      interpretar,
      solicitarCorreccion: vi.fn().mockRejectedValue(new Error("x")),
    });
    await b.generar();
    expect(b.args.setErrorCorreccion).toHaveBeenLastCalledWith(
      "No se pudo releer el correo. Intenta de nuevo.",
    );
  });

  it("si interpretar falla o no pide releer, sigue como reorganizar", async () => {
    const solicitarPropuesta = vi.fn().mockResolvedValue({ tipo: "aclaracion", mensaje: "m" });
    const { args, generar } = armar({
      onAplicarCorreccion: vi.fn(),
      interpretar: vi.fn().mockRejectedValue(new Error("sin red")),
      solicitarPropuesta,
    });
    await generar();
    expect(args.setInterpretando).toHaveBeenNthCalledWith(1, true);
    expect(args.setInterpretando).toHaveBeenLastCalledWith(false);
    expect(solicitarPropuesta).toHaveBeenCalledTimes(1);
  });
});
