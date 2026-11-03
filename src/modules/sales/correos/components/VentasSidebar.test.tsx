import { act, render, screen } from "@testing-library/react";
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

import {
  useVentasMenuStore,
  VENTAS_MENU_ID,
  VentasSidebar,
} from "./VentasSidebar";

const MENU = "Menú de Ventas";

describe("VentasSidebar (REQ-104)", () => {
  beforeEach(() => {
    estado.pathname = ROUTES.dashboardVentasOrdenes;
    estado.idRol = "operador_cuenta";
    useVentasMenuStore.setState({ abierto: true });
  });

  it("ofrece volver a las órdenes y las dos opciones de correos, con su ruta", () => {
    render(<VentasSidebar />);

    expect(screen.getByRole("navigation", { name: MENU })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Órdenes de venta" })).toHaveAttribute(
      "href",
      ROUTES.dashboardVentasOrdenes,
    );
    expect(screen.getByRole("link", { name: "Correos recibidos" })).toHaveAttribute(
      "href",
      ROUTES.dashboardVentasCorreosMateo,
    );
    expect(
      screen.getByRole("link", { name: "Correos descartados" }),
    ).toHaveAttribute("href", ROUTES.dashboardVentasCorreosDescartados);
  });

  it("desde un correo se puede regresar a las órdenes", () => {
    estado.pathname = ROUTES.dashboardVentasCorreosDescartados;
    render(<VentasSidebar />);

    const volver = screen.getByRole("link", { name: "Órdenes de venta" });
    expect(volver).toHaveAttribute("href", ROUTES.dashboardVentasOrdenes);
    expect(volver).not.toHaveAttribute("aria-current");
  });

  it.each([
    [ROUTES.dashboardVentasOrdenes, "Órdenes de venta"],
    [ROUTES.dashboardVentasCorreosMateo, "Correos recibidos"],
    [ROUTES.dashboardVentasCorreosDescartados, "Correos descartados"],
  ])("en %s marca como actual solo «%s»", (ruta, nombre) => {
    estado.pathname = ruta;
    render(<VentasSidebar />);

    const actuales = screen.getAllByRole("link", { current: "page" });
    expect(actuales).toHaveLength(1);
    expect(actuales[0]).toHaveAccessibleName(nombre);
  });

  it("se despliega y se oculta con el estado compartido, y oculto no se puede recorrer con teclado", () => {
    const { container } = render(<VentasSidebar />);
    const aside = container.querySelector(`#${VENTAS_MENU_ID}`);
    expect(aside).not.toBeNull();
    expect(screen.getByRole("navigation", { name: MENU })).not.toHaveAttribute("inert");

    act(() => useVentasMenuStore.getState().alternar());

    // `inert` saca los enlaces del orden de tabulación y del árbol de accesibilidad
    // (jsdom no lo aplica, por eso se verifica el atributo y no la consulta por rol).
    const nav = container.querySelector("nav");
    expect(nav).toHaveAttribute("inert");

    act(() => useVentasMenuStore.getState().alternar());
    expect(container.querySelector("nav")).not.toHaveAttribute("inert");
  });

  it("también muestra a los administradores de cuenta", () => {
    estado.idRol = "administrador_cuenta";
    render(<VentasSidebar />);
    expect(screen.getByRole("navigation", { name: MENU })).toBeInTheDocument();
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
