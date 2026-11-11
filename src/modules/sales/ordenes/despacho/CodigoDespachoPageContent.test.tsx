import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({
  codigoCuenta: "1YW43" as string | null,
  impresora: { nombre: "Epson de despacho" } as { nombre: string } | null,
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
  imprimirCodigoDespacho: estado.imprimir,
}));

import { CodigoDespachoPageContent } from "./CodigoDespachoPageContent";
import { CodigoDespachoError } from "./imprimir-codigo-despacho";

const IMPRIMIR = "Imprimir código";

describe("CodigoDespachoPageContent (REQ-306)", () => {
  beforeEach(() => {
    estado.codigoCuenta = "1YW43";
    estado.impresora = { nombre: "Epson de despacho" };
    estado.imprimir
      .mockReset()
      .mockResolvedValue({ via: "ipp", impresora: "Epson de despacho", queue: { kind: "unknown" } });
  });

  it("dice en qué impresora saldrá y la manda a imprimir sin descargar nada", async () => {
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);

    expect(screen.getByRole("heading", { name: "Código de despacho" })).toBeInTheDocument();
    expect(await screen.findByText("Se imprimirá en Epson de despacho.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: IMPRIMIR }));

    expect(estado.imprimir).toHaveBeenCalledWith("1YW43");
    expect(await screen.findByRole("status")).toHaveTextContent("Se envió a Epson de despacho.");
    expect(screen.queryByRole("button", { name: /descargar/i })).not.toBeInTheDocument();
  });

  it("si la impresora dejó el trabajo en cola avisa con ámbar y dice qué pasó", async () => {
    estado.imprimir.mockResolvedValue({
      via: "qz-tray",
      impresora: "Epson de despacho",
      queue: { kind: "queued_offline" },
    });
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);

    await user.click(await screen.findByRole("button", { name: IMPRIMIR }));

    expect(await screen.findByRole("status")).toHaveTextContent(/Quedó en la cola/);
  });

  it("si falla muestra el mensaje claro y deja volver a intentar", async () => {
    estado.imprimir.mockRejectedValue(new CodigoDespachoError("No hay impresora configurada."));
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);

    await user.click(await screen.findByRole("button", { name: IMPRIMIR }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No hay impresora configurada.");
    await waitFor(() => expect(screen.getByRole("button", { name: IMPRIMIR })).toBeEnabled());
  });

  it("un error inesperado no muestra su texto técnico", async () => {
    estado.imprimir.mockRejectedValue(new Error("TypeError: x is undefined"));
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);

    await user.click(await screen.findByRole("button", { name: IMPRIMIR }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo enviar a la impresora. Inténtalo de nuevo.",
    );
  });

  it("sin impresora configurada avisa qué hacer y no deja imprimir", async () => {
    estado.impresora = null;
    render(<CodigoDespachoPageContent />);

    expect(await screen.findByText(/no tiene una impresora configurada/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: IMPRIMIR })).toBeDisabled();
  });

  it("sin cuenta activa el botón queda deshabilitado", () => {
    estado.codigoCuenta = null;
    render(<CodigoDespachoPageContent />);

    expect(screen.getByRole("button", { name: IMPRIMIR })).toBeDisabled();
  });
});
