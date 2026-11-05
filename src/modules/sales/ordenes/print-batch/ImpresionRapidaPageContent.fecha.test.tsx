import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listOrdenes = vi.fn();

vi.mock("@/components/shared/module/OperationalModuleShell", () => ({
  OperationalModuleShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
vi.mock("@/modules/admin-panel/shared/hooks/useAdminMaestroScope", () => ({
  useAdminMaestroScope: () => ({ codigoCuenta: "JBR", inspect: false, runScoped: <T,>(fn: () => Promise<T>) => fn() }),
}));
vi.mock("@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria", () => ({
  useCuentaZonaHoraria: () => "America/Bogota",
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ session: { nombre: "Dani", idUsuario: "u1" } }) },
}));
vi.mock("../../shared/services/sales.service", () => ({
  listOrdenesVentaOperador: (...args: unknown[]) => listOrdenes(...args),
}));
vi.mock("@/modules/configurator/impresoras/services/impresoras.service", () => ({
  getImpresoraActivaCuenta: () => Promise.resolve({ nombre: "Brother cocina", modoEnvio: "ipp" }),
}));

import { ImpresionRapidaPageContent } from "./ImpresionRapidaPageContent";

const campoFecha = () => screen.getByRole("textbox", { name: /Imprimir con entrega hasta/ });
const botonPreparar = () => screen.getByRole("button", { name: "Preparar impresión" });

beforeEach(() => {
  vi.clearAllMocks();
  listOrdenes.mockResolvedValue([]);
});

describe("ImpresionRapidaPageContent: el campo «Imprimir con entrega hasta»", () => {
  it("nace con la fecha de hoy (DD/MM/AAAA) y deja preparar la impresión", () => {
    render(<ImpresionRapidaPageContent />);

    expect(campoFecha()).toHaveValue(
      new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()),
    );
    expect(botonPreparar()).toBeEnabled();
  });

  it("si se borra la fecha, el botón se deshabilita y no se lee ninguna orden", async () => {
    render(<ImpresionRapidaPageContent />);

    await userEvent.clear(campoFecha());

    expect(botonPreparar()).toBeDisabled();
    await userEvent.type(campoFecha(), "{Enter}");
    expect(listOrdenes).not.toHaveBeenCalled();
  });

  it("una fecha escrita a mano y válida vuelve a habilitar el botón", async () => {
    render(<ImpresionRapidaPageContent />);
    await userEvent.clear(campoFecha());

    await userEvent.type(campoFecha(), "05/11/2026{Enter}");

    expect(campoFecha()).toHaveValue("05/11/2026");
    expect(botonPreparar()).toBeEnabled();
  });

  it("una fecha que no existe no se acepta: vuelve a la última válida", async () => {
    render(<ImpresionRapidaPageContent />);
    await userEvent.clear(campoFecha());
    await userEvent.type(campoFecha(), "05/11/2026{Enter}");

    // Se reemplaza el texto sin vaciarlo: el estado conserva la última fecha válida.
    await userEvent.tripleClick(campoFecha());
    await userEvent.type(campoFecha(), "31/02/2026{Enter}");

    expect(campoFecha()).toHaveValue("05/11/2026");
    expect(botonPreparar()).toBeEnabled();
  });

  it("las letras no valen como fecha: al salir del campo vuelve a la última fecha válida", async () => {
    render(<ImpresionRapidaPageContent />);
    await userEvent.clear(campoFecha());
    await userEvent.type(campoFecha(), "05/11/2026{Enter}");

    await userEvent.tripleClick(campoFecha());
    await userEvent.type(campoFecha(), "abc{Enter}");

    expect(campoFecha()).toHaveValue("05/11/2026");
    expect(botonPreparar()).toBeEnabled();
  });
});
