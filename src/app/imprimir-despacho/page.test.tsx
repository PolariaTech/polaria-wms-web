import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ImprimirDespachoPage from "./page";

const sesion = vi.hoisted(() => ({
  hidratada: true,
  codigoCuenta: "023WA",
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (state: {
    isHydrated: boolean;
    session: { codigoCuenta: string } | null;
    context: { codigoCuenta: string } | null;
  }) => unknown) =>
    selector({
      isHydrated: sesion.hidratada,
      session: { codigoCuenta: sesion.codigoCuenta },
      context: null,
    }),
}));

describe("ImprimirDespachoPage", () => {
  beforeEach(() => {
    sesion.hidratada = true;
    sesion.codigoCuenta = "023WA";
  });

  it("ofrece el PDF de la cuenta que ya está abierta", async () => {
    render(<ImprimirDespachoPage />);
    expect(await screen.findByRole("button", { name: "Generar PDF" })).toBeEnabled();
    expect(screen.queryByText(/lleva el código de la cuenta/)).not.toBeInTheDocument();
  });

  it("no ofrece el PDF si la sesión no tiene cuenta", async () => {
    sesion.codigoCuenta = "  ";
    render(<ImprimirDespachoPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("no tiene una cuenta");
    expect(screen.queryByRole("button", { name: "Generar PDF" })).not.toBeInTheDocument();
  });
});
