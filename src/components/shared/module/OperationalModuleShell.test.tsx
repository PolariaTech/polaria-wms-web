import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";

const estado = vi.hoisted(() => ({
  pathname: "/dashboard/ventas/ordenes",
  idRol: "operador_cuenta" as string | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => estado.pathname,
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (s: { session: { idRol: string } | null }) => unknown,
  ) => selector({ session: estado.idRol ? { idRol: estado.idRol } : null }),
}));

// Los guardas dependen de sesión y tenant: aquí solo importa el encabezado.
vi.mock("@/components/auth/guards/BodegaRequiredGuard", () => ({
  BodegaRequiredGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/auth/guards/TenantScopeGuard", () => ({
  TenantScopeGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./ModuleRoleGate", () => ({
  ModuleRoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { OperationalModuleShell } from "./OperationalModuleShell";

const BOTON = /menú de Ventas/;

function renderizar() {
  return render(
    <OperationalModuleShell
      title="Correos recibidos"
      description="Todos los correos de pedidos."
      gate={{ roles: [] }}
    >
      <p>contenido</p>
    </OperationalModuleShell>,
  );
}

describe("OperationalModuleShell — botón del menú de Ventas (REQ-104)", () => {
  beforeEach(() => {
    estado.pathname = ROUTES.dashboardVentasCorreosMateo;
    estado.idRol = "operador_cuenta";
  });

  it("en Ventas pone el botón en el encabezado, justo antes del título", () => {
    renderizar();

    const boton = screen.getByRole("button", { name: BOTON });
    const titulo = screen.getByRole("heading", { level: 1, name: "Correos recibidos" });
    expect(boton.parentElement).toBe(titulo.parentElement);
    expect(boton.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("la descripción queda bajo la fila del botón y el título", () => {
    renderizar();

    const descripcion = screen.getByText("Todos los correos de pedidos.");
    const titulo = screen.getByRole("heading", { level: 1 });
    expect(descripcion.parentElement).toBe(titulo.parentElement?.parentElement);
  });

  it("fuera de Ventas el título no lleva botón", () => {
    estado.pathname = "/dashboard/compras";
    renderizar();

    expect(screen.queryByRole("button", { name: BOTON })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Correos recibidos" })).toBeInTheDocument();
  });

  it("para un rol que no es de cuenta el título no lleva botón", () => {
    estado.idRol = "operario";
    renderizar();

    expect(screen.queryByRole("button", { name: BOTON })).not.toBeInTheDocument();
  });
});
