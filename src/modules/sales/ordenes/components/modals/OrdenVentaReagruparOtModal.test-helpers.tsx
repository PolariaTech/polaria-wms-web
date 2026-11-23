import { vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RespuestaReagrupacion } from "../../services/reagrupar-ot.client";
import type { EstadoBaseApi, PropuestaReagrupacionApi } from "../../utils/ot/reagrupar-ordenes-trabajo";
import { OrdenVentaReagruparOtModal, type OrdenVentaReagruparOtModalProps } from "./OrdenVentaReagruparOtModal";

export const estadoBase = (producto = "PAPAYA"): EstadoBaseApi => ({
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

export const propuesta: PropuestaReagrupacionApi = {
  propuestaId: "prop-1",
  baseHash: "hash",
  ots: [
    { otId: "ot-comedor", nuevaClave: null, etiquetaSugerida: null, renglonIds: ["renglon-0-0", "renglon-1-0"] },
  ],
  resumen: { antes: 5, despues: 3, nuevas: 0, vacias: 2 },
  movimientos: [{ renglonId: "renglon-1-0", deOtId: "ot-banquetes", aOtId: "ot-comedor" }],
};

export const respuestaPropuesta: RespuestaReagrupacion = { tipo: "propuesta", propuesta };

/** Promesa controlable desde la prueba. */
export function diferida<T>() {
  let resolver!: (valor: T) => void;
  let rechazar!: (error: unknown) => void;
  const promesa = new Promise<T>((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

export function montar(extra: Partial<OrdenVentaReagruparOtModalProps> = {}) {
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
export async function cancelarConfirmando(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
  await usuario.click(screen.getByRole("button", { name: "Sí, cancelar" }));
}

export async function escribirYGenerar(texto = "Junta las OT") {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText("Instrucción"), texto);
  await usuario.click(screen.getByRole("button", { name: "Generar" }));
  return usuario;
}

