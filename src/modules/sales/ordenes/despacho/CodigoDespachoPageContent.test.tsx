import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const PDF = new Blob(["pdf"], { type: "application/pdf" });

const estado = vi.hoisted(() => ({
  codigoCuenta: "1YW43" as string | null,
  impresora: { nombre: "Epson de despacho" } as { nombre: string } | null,
  preparar: vi.fn(),
  imprimir: vi.fn(),
}));

vi.mock("@/components/shared/module/OperationalModuleShell", () => ({
  OperationalModuleShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <section aria-label={title}>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));
vi.mock("@/modules/admin-panel/shared/hooks/useAdminMaestroScope", () => ({
  useAdminMaestroScope: () => ({ codigoCuenta: estado.codigoCuenta }),
}));
vi.mock("@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria", () => ({
  useCuentaZonaHoraria: () => "America/Bogota",
}));
vi.mock("@/modules/configurator/impresoras/services/impresoras.service", () => ({
  getImpresoraActivaCuenta: () => Promise.resolve(estado.impresora),
}));
vi.mock("./imprimir-codigo-despacho", () => ({
  CodigoDespachoError: class CodigoDespachoError extends Error {},
  prepararCodigoDespacho: estado.preparar,
  imprimirCodigoDespacho: estado.imprimir,
}));

import { CodigoDespachoPageContent } from "./CodigoDespachoPageContent";
import { CodigoDespachoError } from "./imprimir-codigo-despacho";

const IMPRIMIR = "Imprimir código";
const VISTA = "Vista previa de la hoja con el código QR de despacho";

describe("CodigoDespachoPageContent (REQ-306)", () => {
  beforeEach(() => {
    estado.codigoCuenta = "1YW43";
    estado.impresora = { nombre: "Epson de despacho" };
    estado.preparar.mockReset().mockResolvedValue(PDF);
    estado.imprimir
      .mockReset()
      .mockResolvedValue({ via: "ipp", impresora: "Epson de despacho", queue: { kind: "unknown" } });
    URL.createObjectURL = vi.fn(() => "data:application/pdf;base64,AA==");
    URL.revokeObjectURL = vi.fn();
  });

  it("muestra la hoja antes de imprimir, sin textos sobre la impresora", async () => {
    render(<CodigoDespachoPageContent />);

    expect(screen.getByRole("heading", { name: "Código de despacho" })).toBeInTheDocument();
    const vista = await screen.findByTitle(VISTA);
    expect(vista).toHaveAttribute("src", "data:application/pdf;base64,AA==");
    expect(screen.queryByText(/Se imprimirá en/)).not.toBeInTheDocument();
    expect(estado.preparar).toHaveBeenCalledWith("1YW43");
    expect(estado.imprimir).not.toHaveBeenCalled();
  });

  it("imprime exactamente la hoja que se ve en la vista previa, sin descargar nada", async () => {
    render(<CodigoDespachoPageContent />);
    await screen.findByTitle(VISTA);

    fireEvent.click(screen.getByRole("button", { name: IMPRIMIR }));

    expect(estado.imprimir).toHaveBeenCalledTimes(1);
    // Misma hoja (por identidad), no una copia: lo que se ve es lo que sale.
    expect(estado.imprimir.mock.calls[0]?.[0] === PDF).toBe(true);
    expect(estado.imprimir.mock.calls[0]?.[1]).toBe("1YW43");
    expect(await screen.findByRole("status")).toHaveTextContent("Se envió a Epson de despacho.");
    expect(screen.queryByText(/descargar/i)).not.toBeInTheDocument();
  });

  it("no deja imprimir mientras la hoja no esté lista", () => {
    estado.preparar.mockReturnValue(new Promise(() => undefined));
    render(<CodigoDespachoPageContent />);

    expect(screen.getByText("Preparando la hoja…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: IMPRIMIR })).toBeDisabled();
  });

  it("si no se puede armar la hoja dice qué pasó y no ofrece imprimir", async () => {
    estado.preparar.mockRejectedValue(new CodigoDespachoError("No se pudo generar el PDF."));
    render(<CodigoDespachoPageContent />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo generar el PDF.");
    expect(screen.queryByTitle(VISTA)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: IMPRIMIR })).toBeDisabled();
  });

  it("si la impresora dejó el trabajo en cola avisa con ámbar y dice qué pasó", async () => {
    estado.imprimir.mockResolvedValue({
      via: "qz-tray",
      impresora: "Epson de despacho",
      queue: { kind: "queued_offline" },
    });
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);
    await screen.findByTitle(VISTA);

    await user.click(screen.getByRole("button", { name: IMPRIMIR }));

    expect(await screen.findByRole("status")).toHaveTextContent(/Quedó en la cola/);
  });

  it("si la impresión falla muestra el mensaje claro y deja volver a intentar", async () => {
    estado.imprimir.mockRejectedValue(new CodigoDespachoError("No hay impresora configurada."));
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);
    await screen.findByTitle(VISTA);

    await user.click(screen.getByRole("button", { name: IMPRIMIR }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No hay impresora configurada.");
    await waitFor(() => expect(screen.getByRole("button", { name: IMPRIMIR })).toBeEnabled());
  });

  it("un error inesperado al imprimir no muestra su texto técnico", async () => {
    estado.imprimir.mockRejectedValue(new Error("TypeError: x is undefined"));
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);
    await screen.findByTitle(VISTA);

    await user.click(screen.getByRole("button", { name: IMPRIMIR }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo enviar a la impresora. Inténtalo de nuevo.",
    );
  });

  it("sin impresora configurada avisa qué hacer y no deja imprimir, aunque la hoja se vea", async () => {
    estado.impresora = null;
    render(<CodigoDespachoPageContent />);

    expect(await screen.findByText(/no tiene una impresora configurada/)).toBeInTheDocument();
    await screen.findByTitle(VISTA);
    expect(screen.getByRole("button", { name: IMPRIMIR })).toBeDisabled();
  });

  it("sin cuenta activa no arma nada y el botón queda deshabilitado", () => {
    estado.codigoCuenta = null;
    render(<CodigoDespachoPageContent />);

    expect(estado.preparar).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: IMPRIMIR })).toBeDisabled();
  });

  it("libera la vista previa al salir de la página", async () => {
    const { unmount } = render(<CodigoDespachoPageContent />);
    await screen.findByTitle(VISTA);

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("data:application/pdf;base64,AA==");
  });
});
