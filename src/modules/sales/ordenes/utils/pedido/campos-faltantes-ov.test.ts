import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import { emptyCompradorAltaFicha } from "@/modules/admin-panel/compradores/utils/comprador-alta";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";
import {
  useAbrirCapturaOv,
  useAvisosValidacionOv,
  usePrefillYDiscrepanciasOv,
} from "./campos-faltantes-ov";

const avisosBase = {
  discrepancias: [],
  fechaEntrega: "2020-01-01",
  fechaEntregaAtrasada: false,
  correo: "",
  warnFields: new Set<string>(),
  ordenCompraHotel: "",
  ordenesTrabajoForm: [],
  compradorLabel: "",
  editingId: "",
  operadorRowsForDuplicado: [],
  idOrdenVenta: null,
};

describe("useAvisosValidacionOv", () => {
  it("una fecha de entrega atrasada entra al aviso de revisión", () => {
    const { result } = renderHook(() =>
      useAvisosValidacionOv({ ...avisosBase, fechaEntregaAtrasada: true }),
    );
    expect(result.current.avisosValidacion).toEqual([
      expect.objectContaining({
        fieldKey: "fechaEntrega",
        db: "Hoy o posterior",
      }),
    ]);
    expect(result.current.avisosCatalogoValidacion).toHaveLength(1);
  });

  it("sin discrepancias ni orden de compra no hay avisos", () => {
    const { result } = renderHook(() => useAvisosValidacionOv(avisosBase));
    expect(result.current.avisosValidacion).toEqual([]);
    expect(result.current.avisoPotencialDuplicado).toBeNull();
  });
});

describe("useAbrirCapturaOv", () => {
  it("captura desde cero entra al formulario cuando el catálogo ya está listo", async () => {
    const setStartMode = vi.fn();
    const setError = vi.fn();
    const setStep = vi.fn();
    const ensureFormDataReady = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useAbrirCapturaOv({
        setStartMode,
        setError,
        setStep,
        ensureFormDataReady,
        setIsCompradorCreateOpen: vi.fn(),
        setCompradores: vi.fn(),
        idComprador: "",
        handleSelectComprador: vi.fn(),
      }),
    );

    result.current.openFormFromScratch();
    await vi.waitFor(() => expect(setStep).toHaveBeenCalledWith("form"));
    expect(setStartMode).toHaveBeenCalledWith("scratch");
    expect(setError).toHaveBeenCalledWith(null);
  });
});

const hotel: CompradorListRow = {
  idComprador: "c2",
  codigo: "HS",
  comprador: "Hotel Sur",
  apodo: "",
  telefono: "555",
  rfc: "",
  grupo: "",
  estaActivo: true,
};

/** Estado del formulario con un espía por cada setter que el hook llame. */
function estadoSimulado() {
  const espias: Record<string, ReturnType<typeof vi.fn>> = {};
  const estado = new Proxy({} as Record<string, unknown>, {
    get: (_destino, clave: string) => (espias[clave] ??= vi.fn()),
  }) as unknown as OrdenVentaFormEstado;
  return { estado, espias };
}

function fichaConDireccion(direccion: string) {
  const ficha = emptyCompradorAltaFicha();
  ficha.centros = [
    {
      nombre: "Cocina central",
      dias: "",
      direccion,
      cp: "",
      anden: "",
      desde: "",
      hasta: "",
      contacto: "",
      telefono: "",
      carreteraFederal: "",
      notas: "",
    },
  ];
  return ficha;
}

/** Valor final de `setDireccion` al aplicar el prefill con la dirección actual `previa`. */
function direccionResultante(params: {
  previa: string;
  ficha: ReturnType<typeof emptyCompradorAltaFicha>;
  options?: { onlyEmpty?: boolean; ultimaDireccionConfirmada?: string | null };
}): string {
  const { estado, espias } = estadoSimulado();
  const { result } = renderHook(() => usePrefillYDiscrepanciasOv(estado));

  result.current.applyCompradorPrefill(hotel, params.ficha, params.options);

  const actualizar = espias.setDireccion?.mock.calls[0]?.[0] as (previa: string) => string;
  return actualizar(params.previa);
}

describe("applyCompradorPrefill — dirección de entrega (REQ-252)", () => {
  it("sin última dirección confirmada usa la de la ficha, como antes", () => {
    const direccion = direccionResultante({
      previa: "",
      ficha: fichaConDireccion("Av. de la ficha 1"),
    });

    expect(direccion).toBe("Av. de la ficha 1");
  });

  it("con una última dirección confirmada, esa gana sobre la de la ficha", () => {
    const direccion = direccionResultante({
      previa: "",
      ficha: fichaConDireccion("Av. de la ficha 1"),
      options: { ultimaDireccionConfirmada: "Blvd. Kukulcán km 9" },
    });

    expect(direccion).toBe("Blvd. Kukulcán km 9");
  });

  it("una última dirección en blanco no pisa la de la ficha", () => {
    const direccion = direccionResultante({
      previa: "",
      ficha: fichaConDireccion("Av. de la ficha 1"),
      options: { ultimaDireccionConfirmada: "   " },
    });

    expect(direccion).toBe("Av. de la ficha 1");
  });

  it("con onlyEmpty no pisa la dirección que el pedido ya trae, ni con la última confirmada", () => {
    const direccion = direccionResultante({
      previa: "Dirección del correo",
      ficha: fichaConDireccion("Av. de la ficha 1"),
      options: { onlyEmpty: true, ultimaDireccionConfirmada: "Blvd. Kukulcán km 9" },
    });

    expect(direccion).toBe("Dirección del correo");
  });
});
