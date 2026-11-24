import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaReagruparOtModal } from "./OrdenVentaReagruparOtModal";

import { estadoBase } from "./OrdenVentaReagruparOtModal.test-helpers";

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

});
