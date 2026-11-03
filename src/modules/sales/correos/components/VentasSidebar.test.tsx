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

import { VentasSidebar } from "./VentasSidebar";

describe("VentasSidebar (REQ-104)", () => {
  beforeEach(() => {
    estado.pathname = ROUTES.dashboardVentasOrdenes;
    estado.idRol = "operador_cuenta";
  });

  it("ofrece las dos opciones de correos con su ruta", () => {
    render(<VentasSidebar />);

    const nav = screen.getByRole("navigation", { name: "Correos de pedidos" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Correos recibidos" })).toHaveAttribute(
      "href",
      ROUTES.dashboardVentasCorreosMateo,
    );
    expect(
      screen.getByRole("link", { name: "Correos descartados" }),
    ).toHaveAttribute("href", ROUTES.dashboardVentasCorreosDescartados);
  });

  it("en otra pantalla de Ventas ninguna opción queda marcada como actual", () => {
    render(<VentasSidebar />);
    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });

  it("marca como actual solo la opción de la pantalla abierta", () => {
    estado.pathname = ROUTES.dashboardVentasCorreosDescartados;
    render(<VentasSidebar />);

    expect(screen.getByRole("link", { name: "Correos descartados" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Correos recibidos" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("también muestra a los administradores de cuenta", () => {
    estado.idRol = "administrador_cuenta";
    render(<VentasSidebar />);
    expect(screen.getByRole("navigation", { name: "Correos de pedidos" })).toBeInTheDocument();
  });

  it.each(["configurador", "operario", null])(
    "no se muestra al rol %s",
    (rol) => {
      estado.idRol = rol;
      render(<VentasSidebar />);
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    },
  );
});
