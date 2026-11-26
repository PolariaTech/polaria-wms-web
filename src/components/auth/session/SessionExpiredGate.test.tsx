import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionExpiredGate } from "./SessionExpiredGate";
import { useSessionExpiredStore } from "@/stores/session-expired.store";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  expireLocalAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/lib/auth/auth-sync", () => ({
  expireLocalAuth: () => mocks.expireLocalAuth(),
}));

describe("SessionExpiredGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionExpiredStore.setState({ isOpen: false });
  });

  it("no muestra nada mientras la sesión no haya expirado", () => {
    render(<SessionExpiredGate />);

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("muestra el aviso con un único botón Aceptar", () => {
    useSessionExpiredStore.setState({ isOpen: true });

    render(<SessionExpiredGate />);

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("Sesión expirada")).toBeTruthy();
    expect(
      screen.getByText("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión."),
    ).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeTruthy();
  });

  it("no se cierra con Escape ni con clic fuera del cuadro", () => {
    useSessionExpiredStore.setState({ isOpen: true });
    const { baseElement } = render(<SessionExpiredGate />);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    const contenedor = baseElement.querySelector(
      "[data-polaria-session-expired-gate]",
    ) as HTMLElement;
    fireEvent.click(contenedor);

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(useSessionExpiredStore.getState().isOpen).toBe(true);
    expect(mocks.expireLocalAuth).not.toHaveBeenCalled();
  });

  it("mantiene el foco en Aceptar al pulsar Tab", () => {
    useSessionExpiredStore.setState({ isOpen: true });
    render(<SessionExpiredGate />);
    const aceptar = screen.getByRole("button", { name: "Aceptar" });

    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Tab" });

    expect(document.activeElement).toBe(aceptar);
  });

  it("al aceptar cierra la sesión local, cierra el modal y va a /login", () => {
    useSessionExpiredStore.setState({ isOpen: true });
    render(<SessionExpiredGate />);

    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(mocks.expireLocalAuth).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith("/login");
    expect(useSessionExpiredStore.getState().isOpen).toBe(false);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
