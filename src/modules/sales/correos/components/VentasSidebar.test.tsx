import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  BotonMenuVentas,
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

  it("arranca cerrado: al entrar a Ventas el menú no ocupa espacio hasta que se despliega", () => {
    expect(useVentasMenuStore.getInitialState().abierto).toBe(false);
  });

  it.each(["administrador_cuenta", "operador_cuenta"])(
    "«Estado de fotos» es un enlace activo para el rol %s (POL-406)",
    (idRol) => {
      estado.idRol = idRol;
      render(<VentasSidebar />);

      expect(screen.getByRole("link", { name: "Estado de fotos" })).toHaveAttribute(
        "href",
        ROUTES.dashboardVentasEstadoFotos,
      );
      expect(screen.getByText("Estado de fotos").closest("[aria-disabled='true']")).toBeNull();
    },
  );

  it("«Estado de fotos» queda marcado como la página actual al estar dentro de ella", () => {
    estado.pathname = ROUTES.dashboardVentasEstadoFotos;
    render(<VentasSidebar />);

    expect(screen.getByRole("link", { name: "Estado de fotos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it.each(["administrador_cuenta", "operador_cuenta"])(
    "«Imprimir PDF» lleva a la página del código de despacho, en otra pestaña, para el rol %s (REQ-306)",
    (idRol) => {
      estado.idRol = idRol;
      render(<VentasSidebar />);

      const enlace = screen.getByRole("link", { name: /^Imprimir PDF/ });
      expect(enlace).toHaveAttribute("href", ROUTES.imprimirDespacho);
      expect(enlace).toHaveAttribute("target", "_blank");
      expect(enlace).toHaveAttribute("rel", "noopener noreferrer");
      expect(enlace).toHaveAccessibleName("Imprimir PDF (se abre en una pestaña nueva)");
      expect(enlace).not.toHaveAttribute("aria-current");
    },
  );

  it("«Imprimir PDF» va después de «Estado de fotos» y los demás enlaces siguen en la misma pestaña", () => {
    render(<VentasSidebar />);

    const fotos = screen.getByRole("link", { name: "Estado de fotos" });
    const imprimir = screen.getByRole("link", { name: /^Imprimir PDF/ });
    expect(fotos.compareDocumentPosition(imprimir) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(fotos).not.toHaveAttribute("target");
    expect(screen.getByRole("link", { name: "Órdenes de venta" })).not.toHaveAttribute("target");
  });

  it("un rol que no es de cuenta no ve el menú, así que tampoco «Estado de fotos»", () => {
    estado.idRol = "operario";
    render(<VentasSidebar />);

    expect(screen.queryByRole("link", { name: "Estado de fotos" })).not.toBeInTheDocument();
  });

  it("ofrece volver a las órdenes y las dos opciones de correos, con su ruta", () => {
    render(<VentasSidebar />);

    expect(screen.getByRole("navigation", { name: MENU })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Órdenes de venta" })).toHaveAttribute(
      "href",
      ROUTES.dashboardVentasOrdenes,
    );
    // «Impresión en grupo» es un desplegable: las formas de imprimir aparecen al abrirlo.
    expect(screen.getByRole("button", { name: "Impresión en grupo" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("link", { name: "Correos procesados" })).toHaveAttribute(
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
    [ROUTES.dashboardVentasImpresionDetallada, "Impresión detallada"],
    [ROUTES.dashboardVentasImpresionRapida, "Impresión rápida"],
    [ROUTES.dashboardVentasCorreosMateo, "Correos procesados"],
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

  it("abierto, trae su propia «×» a la altura del primer enlace (solo en la columna, desde `lg`) que lo oculta", async () => {
    const user = userEvent.setup();
    render(<VentasSidebar />);

    const nav = screen.getByRole("navigation", { name: MENU });
    const boton = within(nav).getByRole("button", { name: "Ocultar menú de Ventas" });
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(boton).toHaveAttribute("aria-controls", VENTAS_MENU_ID);
    expect(boton).toHaveClass("hidden", "lg:inline-flex");
    expect(boton.querySelector("svg.lucide-x")).not.toBeNull();
    // misma fila que «Órdenes de venta», el primer enlace del menú
    const primero = within(nav).getByRole("link", { name: "Órdenes de venta" });
    expect(boton.parentElement).toBe(primero.parentElement);
    expect(primero.compareDocumentPosition(boton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(boton);
    expect(useVentasMenuStore.getState().abierto).toBe(false);
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

describe("BotonMenuVentas (REQ-104)", () => {
  const MOSTRAR = "Mostrar menú de Ventas";
  const OCULTAR = "Ocultar menú de Ventas";

  beforeEach(() => {
    estado.pathname = ROUTES.dashboardVentasOrdenes;
    estado.idRol = "operador_cuenta";
    useVentasMenuStore.setState({ abierto: true });
  });

  it("despliega y oculta el menú, y su nombre dice qué hará al pulsarlo", async () => {
    const user = userEvent.setup();
    render(<BotonMenuVentas />);

    const boton = screen.getByRole("button", { name: OCULTAR });
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(boton).toHaveAttribute("aria-controls", VENTAS_MENU_ID);

    await user.click(boton);
    expect(useVentasMenuStore.getState().abierto).toBe(false);
    const cerrado = screen.getByRole("button", { name: MOSTRAR });
    expect(cerrado).toHaveAttribute("aria-expanded", "false");

    await user.click(cerrado);
    expect(useVentasMenuStore.getState().abierto).toBe(true);
  });

  it("en el encabezado el icono dice el estado: «−» con el menú abierto (cierra) y «+» cerrado (abre)", () => {
    const { container, rerender } = render(<BotonMenuVentas />);
    expect(container.querySelector("svg.lucide-minus")).not.toBeNull();

    act(() => useVentasMenuStore.getState().alternar());
    rerender(<BotonMenuVentas />);
    expect(container.querySelector("svg.lucide-plus")).not.toBeNull();
    expect(container.querySelector("svg.lucide-minus")).toBeNull();
  });

  it("se ve en todos los anchos y se puede tocar: cerrado es el único modo de abrir el menú", () => {
    useVentasMenuStore.setState({ abierto: false });
    render(<BotonMenuVentas />);

    const boton = screen.getByRole("button", { name: MOSTRAR });
    expect(boton).not.toHaveClass("hidden");
    // 0,875 em del título (≈ 42 px con el título de 48 px) y escala con él.
    expect(boton).toHaveClass("h-[0.875em]", "w-[0.875em]");
    expect(boton).not.toHaveClass("min-h-11");
    // El área tocable sigue llegando a 44 px, con un pseudo-elemento invisible.
    expect(boton.className).toContain("after:h-11");
    expect(boton.className).toContain("after:w-11");
  });

  it("el icono y la esquina escalan con el botón; el de la columna conserva su tamaño fijo", () => {
    useVentasMenuStore.setState({ abierto: false });
    const { container } = render(<BotonMenuVentas />);
    expect(container.querySelector("svg")).toHaveClass("h-[0.5em]", "w-[0.5em]");
    expect(screen.getByRole("button", { name: MOSTRAR })).toHaveClass("rounded-[0.2em]");
  });

  it("no aparece fuera de Ventas", () => {
    estado.pathname = "/dashboard";
    render(<BotonMenuVentas />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each(["configurador", "operario", null])(
    "no aparece para el rol %s",
    (rol) => {
      estado.idRol = rol;
      render(<BotonMenuVentas />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    },
  );
});
