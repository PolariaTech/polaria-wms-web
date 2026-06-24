import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  CompanyProvider,
  TenantBodegaSelector,
  useCompany,
} from "@/providers/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthSession } from "@/types/auth";

const tenantSession: AuthSession = {
  idUsuario: "user-1",
  idAuth: "auth-1",
  nombre: "Operador",
  username: "operador.acme",
  correo: "operador@acme.com",
  idRol: "operador",
  nombreRol: "Operador",
  nivelRol: "bodega",
  codigoEmpresa: "ACME",
  razonSocialEmpresa: "ACME Corp",
  codigoCuenta: "CUENTA-01",
  nombreComercialCuenta: "ACME Norte",
  idBodegas: ["BOD-01", "BOD-02"],
  scope: "tenant",
};

function TenantProbe() {
  const tenant = useCompany();
  return (
    <div>
      <span data-testid="codigo-empresa">{tenant.codigoEmpresa}</span>
      <span data-testid="codigo-cuenta">{tenant.codigoCuenta}</span>
      <span data-testid="active-bodega">{tenant.activeBodegaId}</span>
      <TenantBodegaSelector />
    </div>
  );
}

describe("CompanyProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({
      accessToken: "token",
      refreshToken: "refresh",
      context: {
        scope: "tenant",
        codigoEmpresa: "ACME",
        codigoCuenta: "CUENTA-01",
        idBodegas: ["BOD-01", "BOD-02"],
        nivelRol: "bodega",
      },
      session: tenantSession,
      isHydrated: true,
      isLoading: false,
    });
  });

  it("expone codigoEmpresa, codigoCuenta e idBodegas activas", () => {
    render(
      <CompanyProvider>
        <TenantProbe />
      </CompanyProvider>,
    );

    expect(screen.getByTestId("codigo-empresa")).toHaveTextContent("ACME");
    expect(screen.getByTestId("codigo-cuenta")).toHaveTextContent("CUENTA-01");
    expect(screen.getByTestId("active-bodega")).toHaveTextContent("BOD-01");
  });

  it("muestra selector cuando hay más de una bodega", async () => {
    const user = userEvent.setup();

    render(
      <CompanyProvider>
        <TenantProbe />
      </CompanyProvider>,
    );

    const select = screen.getByLabelText("Seleccionar bodega activa");
    expect(select).toBeInTheDocument();

    await user.selectOptions(select, "BOD-02");
    expect(screen.getByTestId("active-bodega")).toHaveTextContent("BOD-02");
  });

  it("no muestra selector con una sola bodega", () => {
    useAuthStore.setState({
      session: { ...tenantSession, idBodegas: ["BOD-01"] },
      context: {
        scope: "tenant",
        codigoEmpresa: "ACME",
        codigoCuenta: "CUENTA-01",
        idBodegas: ["BOD-01"],
        nivelRol: "bodega",
      },
    });

    render(
      <CompanyProvider>
        <TenantProbe />
      </CompanyProvider>,
    );

    expect(
      screen.queryByLabelText("Seleccionar bodega activa"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("active-bodega")).toHaveTextContent("BOD-01");
  });
});
