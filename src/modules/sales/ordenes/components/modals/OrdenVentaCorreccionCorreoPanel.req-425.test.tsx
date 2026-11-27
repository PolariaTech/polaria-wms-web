import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PropuestaCorreccionCorreoApi } from "../../utils/ot/aplicar-correccion-correo";
import { OrdenVentaCorreccionCorreoPanel } from "./OrdenVentaCorreccionCorreoPanel";

/** SOLAYA / OV-00002860: el correo y la relectura suman 1,869.00; el formulario, 1,793.00. */
function propuestaSinCambios(): PropuestaCorreccionCorreoApi {
  return {
    requestId: "req-1",
    propuestaId: "prop-1",
    baseHash: "h",
    documentos: [
      {
        nombre: "AGUACATES DE PUEBLA_4503005858.pdf",
        oc: "4503005858",
        ocFuente: "ambas",
        renglones: 12,
        verificacion: { totalDocumento: 1869, importe: 1869, diferencia: 0, cuadra: true },
        relecturaPorBloques: false,
      },
    ],
    ots: [
      {
        id: "pedido:4503005858|almacen:coeg",
        etiqueta: "4503005858 — COEG",
        numeroPedido: "4503005858",
        almacen: "COEG",
        totalCantidad: 8,
        renglones: [{ Producto: "LECHUGA LARGA", Cantidad: 4, Precio: 46 }],
      },
    ],
    resumen: {
      otAntes: 2,
      otDespues: 2,
      renglonesAntes: 12,
      renglonesDespues: 12,
      importeAntes: 1869,
      importeDespues: 1869,
    },
    diff: { otNuevas: [], otEliminadas: [], renglonesAgregados: 0, renglonesQuitados: 0 },
    advertencias: [],
  };
}

function montar(importeFormulario?: number) {
  const onAplicar = vi.fn();
  render(
    <OrdenVentaCorreccionCorreoPanel
      propuesta={propuestaSinCambios()}
      importeFormulario={importeFormulario}
      onAplicar={onAplicar}
      onDescartar={vi.fn()}
    />,
  );
  return { onAplicar };
}

function botonAplicar(): HTMLButtonElement {
  return screen.getByRole("button", { name: /Aplicar al borrador/ }) as HTMLButtonElement;
}

describe("OrdenVentaCorreccionCorreoPanel (REQ-425)", () => {
  it("con el formulario desviado del documento no dice «nada que corregir» y deja aplicar", async () => {
    const { onAplicar } = montar(1793);

    expect(screen.queryByText(/ya coincide con los documentos/)).toBeNull();
    const estado = screen.getByRole("status");
    expect(estado.textContent).toContain("1,793.00");
    expect(estado.textContent).toContain("1,869.00");
    expect(botonAplicar().disabled).toBe(false);

    await userEvent.click(botonAplicar());
    expect(onAplicar).toHaveBeenCalledTimes(1);
  });

  it("con el formulario ya igual al documento sigue sin nada que aplicar", () => {
    montar(1869);

    expect(screen.getByText(/ya coincide con los documentos/)).toBeTruthy();
    expect(botonAplicar().disabled).toBe(true);
  });

  it("sin el importe del formulario no cambia el comportamiento anterior", () => {
    montar();

    expect(screen.getByText(/ya coincide con los documentos/)).toBeTruthy();
    expect(botonAplicar().disabled).toBe(true);
  });
});
