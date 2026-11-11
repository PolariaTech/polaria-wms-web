import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({
  codigoCuenta: "1YW43" as string | null,
  guardar: vi.fn(),
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
vi.mock("./guardar-pdf-codigo-despacho", () => ({
  CodigoDespachoError: class CodigoDespachoError extends Error {},
  guardarPdfCodigoDespacho: estado.guardar,
}));

import { CodigoDespachoPageContent } from "./CodigoDespachoPageContent";
import { CodigoDespachoError } from "./guardar-pdf-codigo-despacho";

describe("CodigoDespachoPageContent (REQ-306)", () => {
  beforeEach(() => {
    estado.codigoCuenta = "1YW43";
    estado.guardar.mockReset().mockResolvedValue(undefined);
  });

  it("explica qué se imprime y descarga el PDF de la cuenta activa", async () => {
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);

    expect(screen.getByRole("heading", { name: "Código de despacho" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Descargar PDF" }));

    expect(estado.guardar).toHaveBeenCalledWith("1YW43");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("si falla muestra el mensaje claro y deja volver a intentar", async () => {
    estado.guardar.mockRejectedValue(new CodigoDespachoError("No se pudo generar el PDF."));
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);

    await user.click(screen.getByRole("button", { name: "Descargar PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo generar el PDF.");
    await waitFor(() => expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeEnabled());
  });

  it("un error inesperado no muestra su texto técnico", async () => {
    estado.guardar.mockRejectedValue(new Error("TypeError: x is undefined"));
    const user = userEvent.setup();
    render(<CodigoDespachoPageContent />);

    await user.click(screen.getByRole("button", { name: "Descargar PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo generar el PDF. Inténtalo de nuevo.",
    );
  });

  it("sin cuenta activa el botón queda deshabilitado", () => {
    estado.codigoCuenta = null;
    render(<CodigoDespachoPageContent />);

    expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeDisabled();
  });
});
