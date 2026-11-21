import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PropuestaCorreccionCorreoApi } from "../../utils/ot/aplicar-correccion-correo";
import { OrdenVentaCorreccionCorreoPanel } from "./OrdenVentaCorreccionCorreoPanel";

function propuesta(parcial: Partial<PropuestaCorreccionCorreoApi> = {}): PropuestaCorreccionCorreoApi {
  return {
    requestId: "req-1",
    propuestaId: "prop-1",
    baseHash: "h",
    documentos: [
      {
        nombre: "AGUACATES_4502987208.pdf",
        oc: "4502987208",
        ocFuente: "ambas",
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
    diff: { otNuevas: ["a", "b"], otEliminadas: [], renglonesAgregados: 22, renglonesQuitados: 0 },
    advertencias: [{ codigo: "ADJUNTO_DUPLICADO", detalle: "Adjunto leído una sola vez." }],
    ...parcial,
  };
}

describe("OrdenVentaCorreccionCorreoPanel REQ-372", () => {
  it("permite aplicar con aviso de mejor esfuerzo si el total del documento no cuadra", () => {
    render(
      <OrdenVentaCorreccionCorreoPanel
        propuesta={propuesta({
          documentos: [
            {
              nombre: "x.pdf",
              oc: null,
              ocFuente: null,
              renglones: 1,
              verificacion: { totalDocumento: 100, importe: 10, diferencia: -90, cuadra: false },
              relecturaPorBloques: true,
            },
          ],
        })}
        onAplicar={vi.fn()}
        onDescartar={vi.fn()}
      />,
    );
    expect(screen.getByText(/No cuadra/)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: /Aplicar al borrador/ }) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(screen.getByText(/mejor esfuerzo/i)).toBeTruthy();
  });
});
