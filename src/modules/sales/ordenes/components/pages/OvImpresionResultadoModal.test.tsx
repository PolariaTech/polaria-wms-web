import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ETIQUETA_RECARGAR_PAGINA } from "../../print/print-correo-fallo";
import {
  OvImpresionResultadoModal,
  type ResultadoImpresion,
} from "./OvImpresionResultadoModal";

const OK: ResultadoImpresion = { ok: true, title: "Enviado a la impresora", lines: ["3 hojas"], retry: null };
const FALLO: ResultadoImpresion = {
  ok: false,
  title: "El correo no fue enviado a la impresora",
  lines: [],
  retry: { idOrdenVenta: "a" },
};

function montar(resultado: ResultadoImpresion | null, extra: Partial<Parameters<typeof OvImpresionResultadoModal>[0]> = {}) {
  const props = {
    resultado,
    ocupado: false,
    reintentando: false,
    onReintentar: vi.fn(),
    onClose: vi.fn(),
    ...extra,
  };
  render(<OvImpresionResultadoModal {...props} />);
  return props;
}

describe("OvImpresionResultadoModal", () => {
  it("sin resultado no dibuja nada", () => {
    const { container } = render(
      <OvImpresionResultadoModal resultado={null} ocupado={false} reintentando={false} onReintentar={vi.fn()} onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("cuando salió bien muestra el título y el detalle, y se cierra con «Entendido»", async () => {
    const props = montar(OK);

    expect(screen.getByRole("alertdialog", { name: "Enviado a la impresora" })).toHaveTextContent("3 hojas");
    await userEvent.click(screen.getByRole("button", { name: "Entendido" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("si falló y hay a qué volver, ofrece «Reintentar» en vez de «Entendido»", async () => {
    const props = montar(FALLO);

    expect(screen.queryByRole("button", { name: "Entendido" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(props.onReintentar).toHaveBeenCalledTimes(1);
  });

  it("mientras hay un envío en curso «Reintentar» queda bloqueado, y dice «Reintentando…» si es una impresión", () => {
    montar(FALLO, { ocupado: true, reintentando: true });

    expect(screen.getByRole("button", { name: "Reintentando…" })).toBeDisabled();
  });

  it("con versión vieja (REQ-189) el botón recarga la página y no reintenta", async () => {
    const recargar = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload: recargar });
    montar({ ok: false, title: "Hay una versión nueva", lines: [], retry: null, recargar: true });

    await userEvent.click(screen.getByRole("button", { name: ETIQUETA_RECARGAR_PAGINA }));

    expect(recargar).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("el fondo también cierra", async () => {
    const props = montar(OK);

    await userEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
