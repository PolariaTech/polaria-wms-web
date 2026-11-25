import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaReagruparOtModalProps } from "../components/modals/reagrupar-ot-modal.types";
import type {
  EstadoBaseApi,
  PropuestaReagrupacionApi,
} from "../utils/ot/reagrupar-ordenes-trabajo";
import { useReagruparOtModal } from "./use-reagrupar-ot-modal";

const estadoBase: EstadoBaseApi = {
  ots: [
    {
      otId: "ot-a",
      etiqueta: "PO-1 — A",
      almacen: "A",
      numeroPedido: "PO-1",
      renglones: [{ renglonId: "r-0", producto: "AGUACATE", cantidad: 25 }],
    },
    {
      otId: "ot-b",
      etiqueta: "PO-2 — B",
      almacen: "B",
      numeroPedido: "PO-2",
      renglones: [{ renglonId: "r-1", producto: "PAPAYA", cantidad: 10 }],
    },
  ],
};

const propuesta: PropuestaReagrupacionApi = {
  propuestaId: "p-1",
  baseHash: "h",
  ots: [{ otId: "ot-a", nuevaClave: null, etiquetaSugerida: null, renglonIds: ["r-0", "r-1"] }],
  resumen: { antes: 2, despues: 1, nuevas: 0, vacias: 1 },
  movimientos: [{ renglonId: "r-1", deOtId: "ot-b", aOtId: "ot-a" }],
};

function armar(parcial: Partial<OrdenVentaReagruparOtModalProps> = {}) {
  let firma = "f1";
  const props: OrdenVentaReagruparOtModalProps = {
    open: true,
    idOrdenVenta: "ov-1",
    onClose: vi.fn(),
    obtenerSolicitud: vi.fn(() => ({ estadoBase, firma })),
    onAplicar: vi.fn(),
    solicitarPropuesta: vi.fn().mockResolvedValue({ tipo: "propuesta", propuesta }),
    generarRequestId: () => "req-1",
    ...parcial,
  };
  const hook = renderHook((p: OrdenVentaReagruparOtModalProps) => useReagruparOtModal(p), {
    initialProps: props,
  });
  return { props, hook, cambiarFirma: (nueva: string) => (firma = nueva) };
}

async function conPropuesta(parcial: Partial<OrdenVentaReagruparOtModalProps> = {}) {
  const ctx = armar(parcial);
  act(() => ctx.hook.result.current.dispatch({ tipo: "ESCRIBIR", texto: "junta A y B" }));
  await act(async () => {
    await ctx.hook.result.current.handleGenerar();
  });
  await waitFor(() => expect(ctx.hook.result.current.enPropuesta).toBe(true));
  return ctx;
}

describe("useReagruparOtModal", () => {
  it("arranca en la fase de escritura, sin carga ni propuesta", () => {
    const { hook } = armar();
    const m = hook.result.current;
    expect(m.estado.fase).toBe("escribiendo");
    expect(m.cargando).toBe(false);
    expect(m.enPropuesta).toBe(false);
    expect(m.textoBloqueado).toBe(false);
    expect(m.propuestaCorreccion).toBeNull();
  });

  it("los grupos de instrucción dependen de onDividir y onAplicarCorreccion", () => {
    expect(armar().hook.result.current.gruposInstruccion).toEqual(["reorganizar"]);
    expect(
      armar({ onDividir: vi.fn(), onAplicarCorreccion: vi.fn() }).hook.result.current
        .gruposInstruccion,
    ).toEqual(["reorganizar", "dividir", "corregir"]);
  });

  it("Escape cierra el modal cuando no hay petición en curso", () => {
    const { props } = armar();
    const evento = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    act(() => {
      document.dispatchEvent(evento);
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("con el modal cerrado Escape no hace nada", () => {
    const { props } = armar({ open: false });
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("generar lleva a la fase de propuesta y bloquea el texto", async () => {
    const { hook } = await conPropuesta();
    const m = hook.result.current;
    expect(m.estado.propuesta?.propuestaId).toBe("p-1");
    expect(m.estado.movimientos).toHaveLength(1);
    expect(m.textoBloqueado).toBe(true);
  });

  it("confirmar aplica la propuesta con la instrucción escrita", async () => {
    const { hook, props } = await conPropuesta();
    await act(async () => {
      await hook.result.current.handleConfirmar();
    });
    expect(props.onAplicar).toHaveBeenCalledWith({
      propuesta,
      instruccion: "junta A y B",
    });
  });

  it("si el formulario cambió, confirmar invalida la propuesta y no aplica", async () => {
    const { hook, props, cambiarFirma } = await conPropuesta();
    cambiarFirma("f2");
    await act(async () => {
      await hook.result.current.handleConfirmar();
    });
    expect(props.onAplicar).not.toHaveBeenCalled();
    expect(hook.result.current.enPropuesta).toBe(false);
    expect(hook.result.current.estado.error).toBeTruthy();
  });

  it("si onAplicar lanza, muestra un error genérico en vez de romper", async () => {
    const onAplicar = vi.fn(() => {
      throw new Error("x");
    });
    const { hook } = await conPropuesta({ onAplicar });
    await act(async () => {
      await hook.result.current.handleConfirmar();
    });
    expect(hook.result.current.estado.error).toBe(
      "No se pudo aplicar la propuesta. Intenta de nuevo.",
    );
  });

  it("cancelar una petición en curso aborta la señal y vuelve a escribir", async () => {
    let senal: AbortSignal | undefined;
    const solicitarPropuesta = vi.fn(
      ({ signal }: { signal?: AbortSignal }) =>
        new Promise<never>(() => {
          senal = signal;
        }),
    );
    const { hook } = armar({
      solicitarPropuesta: solicitarPropuesta as unknown as OrdenVentaReagruparOtModalProps["solicitarPropuesta"],
    });
    act(() => hook.result.current.dispatch({ tipo: "ESCRIBIR", texto: "junta" }));
    act(() => {
      void hook.result.current.handleGenerar();
    });
    await waitFor(() => expect(hook.result.current.cargando).toBe(true));

    act(() => hook.result.current.handleCancelarPeticion());
    expect(senal?.aborted).toBe(true);
    expect(hook.result.current.cargando).toBe(false);
    expect(hook.result.current.estado.fase).toBe("escribiendo");
    expect(hook.result.current.motivoActual).toBe("");
  });

  it("cerrar el modal descarta la propuesta", async () => {
    const { hook, props } = await conPropuesta();
    hook.rerender({ ...props, open: false });
    await waitFor(() => expect(hook.result.current.enPropuesta).toBe(false));
  });
});
