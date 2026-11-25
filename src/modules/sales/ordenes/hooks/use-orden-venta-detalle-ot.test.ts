import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { CypherCompanionOtPicker } from "../components/modals/OrdenVentaCypherDrawer";
import { useOrdenVentaDetalleOt } from "./use-orden-venta-detalle-ot";

const renglon = (almacen: string, pedido: string, cantidad: number) => ({
  Almacen: almacen,
  "Numero pedido": pedido,
  Producto: `P-${pedido}`,
  Cantidad: cantidad,
});

const dosOt = JSON.stringify([renglon("A", "1", 5), renglon("B", "2", 7)]);

function armar(
  parcial: {
    origenCorreo?: unknown;
    cypherOpen?: boolean;
    inspect?: boolean;
    idOrdenVenta?: string | null;
    onCompanionOtPickerChange?: (p: CypherCompanionOtPicker | null) => void;
  } = {},
) {
  return renderHook(() => {
    const [hijaId, setHijaId] = useState<string | null>(null);
    const ot = useOrdenVentaDetalleOt({
      origenCorreo: "origenCorreo" in parcial ? parcial.origenCorreo : dosOt,
      idOrdenVenta: parcial.idOrdenVenta === undefined ? "ov-1" : parcial.idOrdenVenta,
      hijaId,
      setHijaId,
      cypherOpen: parcial.cypherOpen ?? false,
      inspect: parcial.inspect ?? false,
      onCompanionOtPickerChange: parcial.onCompanionOtPickerChange,
    });
    return { ...ot, hijaId, setHijaId };
  });
}

describe("useOrdenVentaDetalleOt", () => {
  it("sin origen no hay OT ni OT activa", () => {
    const { result } = armar({ origenCorreo: null });
    expect(result.current.ordenesTrabajo).toEqual([]);
    expect(result.current.hijaActiva).toBeNull();
    expect(result.current.indiceOt).toBe(0);
  });

  it("con varias OT activa la primera por defecto y la fija en hijaId", () => {
    const { result } = armar();
    expect(result.current.ordenesTrabajo).toHaveLength(2);
    expect(result.current.hijaActiva?.id).toBe(result.current.ordenesTrabajo[0]!.id);
    expect(result.current.hijaId).toBe(result.current.ordenesTrabajo[0]!.id);
  });

  it("cambiar hijaId mueve la OT activa y el índice", () => {
    const { result } = armar();
    const segunda = result.current.ordenesTrabajo[1]!.id;
    act(() => result.current.setHijaId(segunda));
    expect(result.current.hijaActiva?.id).toBe(segunda);
    expect(result.current.indiceOt).toBe(1);
  });

  it("un hijaId desconocido cae a la primera OT", () => {
    const { result } = armar();
    act(() => result.current.setHijaId("no-existe"));
    expect(result.current.hijaActiva?.id).toBe(result.current.ordenesTrabajo[0]!.id);
  });

  it("publica el selector al Cypher compañero solo con Cypher abierto y sin inspección", () => {
    const publicar = vi.fn();
    const { result } = armar({ cypherOpen: true, onCompanionOtPickerChange: publicar });
    const picker = publicar.mock.calls.at(-1)![0] as CypherCompanionOtPicker;
    expect(picker.hijas).toHaveLength(2);
    expect(picker.hijas[0]).toMatchObject({ almacen: "A", productosCount: 1, totalCantidad: 5 });
    expect(picker.selectedId).toBe(result.current.ordenesTrabajo[0]!.id);

    act(() => picker.onSelect(result.current.ordenesTrabajo[1]!.id));
    expect(result.current.hijaId).toBe(result.current.ordenesTrabajo[1]!.id);
  });

  it.each([
    ["Cypher cerrado", { cypherOpen: false }],
    ["inspección", { cypherOpen: true, inspect: true }],
    ["sin OV", { cypherOpen: true, idOrdenVenta: null }],
  ])("no publica selector con %s (publica null)", (_nombre, parcial) => {
    const publicar = vi.fn();
    armar({ ...parcial, onCompanionOtPickerChange: publicar });
    expect(publicar).toHaveBeenLastCalledWith(null);
  });

  it("al desmontar retira el selector", () => {
    const publicar = vi.fn();
    const { unmount } = armar({ cypherOpen: true, onCompanionOtPickerChange: publicar });
    unmount();
    expect(publicar).toHaveBeenLastCalledWith(null);
  });
});
