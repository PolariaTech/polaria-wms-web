import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CuentaCockpitModuloView } from "./CuentaCockpitModuloView";

vi.mock("@/modules/admin-panel/catalogo/components/CatalogoListView", () => ({
  CatalogoListView: ({
    codigoCuenta,
    mode,
  }: {
    codigoCuenta?: string;
    mode?: string;
  }) => (
    <div>{`catalogo ${codigoCuenta} ${mode}`}</div>
  ),
}));

vi.mock("@/modules/admin-panel/lista-precio/components/ListaPrecioListView", () => ({
  ListaPrecioListView: ({
    codigoCuenta,
    mode,
  }: {
    codigoCuenta?: string;
    mode?: string;
  }) => (
    <div>{`lista-precio ${codigoCuenta} ${mode}`}</div>
  ),
}));

vi.mock("@/modules/admin-panel/proveedores/components/ProveedoresListView", () => ({
  ProveedoresListView: ({
    codigoCuenta,
    mode,
  }: {
    codigoCuenta?: string;
    mode?: string;
  }) => (
    <div>{`proveedores ${codigoCuenta} ${mode}`}</div>
  ),
}));

vi.mock("@/modules/admin-panel/clientes/components/ClientesListView", () => ({
  ClientesListView: () => <div>clientes</div>,
}));

vi.mock("@/modules/admin-panel/compradores/components/CompradoresListView", () => ({
  CompradoresListView: () => <div>compradores</div>,
}));

vi.mock("@/modules/admin-panel/camiones/components/CamionesListView", () => ({
  CamionesListView: () => <div>camiones</div>,
}));

vi.mock("@/modules/admin-panel/plantas/components/PlantasListView", () => ({
  PlantasListView: () => <div>plantas</div>,
}));

vi.mock("@/modules/configurator/usuarios/components/UsuariosListView", () => ({
  UsuariosListView: () => <div>usuarios</div>,
}));

vi.mock("@/modules/purchases", () => ({
  ComprasPageContent: ({
    codigoCuenta,
    mode,
  }: {
    codigoCuenta?: string;
    mode?: string;
  }) => <div>{`compras ${codigoCuenta} ${mode}`}</div>,
}));

vi.mock("@/modules/sales", () => ({
  OperadorOrdenesVentaPageContent: ({
    codigoCuenta,
    mode,
  }: {
    codigoCuenta?: string;
    mode?: string;
  }) => <div>{`ventas ${codigoCuenta} ${mode}`}</div>,
}));

vi.mock("@/modules/transport", () => ({
  TransportePageContent: ({
    codigoCuenta,
    mode,
  }: {
    codigoCuenta?: string;
    mode?: string;
  }) => <div>{`transporte ${codigoCuenta} ${mode}`}</div>,
}));

vi.mock(
  "@/modules/admin-panel/inventario-mercancia/components/InventarioMercanciaReportView",
  () => ({
    InventarioMercanciaReportView: ({
      codigoCuenta,
      mode,
    }: {
      codigoCuenta?: string;
      mode?: string;
    }) => <div>{`reportes ${codigoCuenta} ${mode}`}</div>,
  }),
);

describe("CuentaCockpitModuloView", () => {
  it("muestra el catálogo real de la cuenta en modo inspect", () => {
    render(
      <CuentaCockpitModuloView codigoCuenta="49M04" modulo="catalogo" />,
    );

    expect(screen.getByText("catalogo 49M04 inspect")).toBeInTheDocument();
  });

  it("muestra la lista de precio real de la cuenta", () => {
    render(
      <CuentaCockpitModuloView codigoCuenta="49M04" modulo="lista-precio" />,
    );

    expect(screen.getByText("lista-precio 49M04 inspect")).toBeInTheDocument();
  });

  it("muestra compras, ventas, transporte y reportes reales en inspect", () => {
    const { rerender } = render(
      <CuentaCockpitModuloView codigoCuenta="49M04" modulo="compras" />,
    );
    expect(screen.getByText("compras 49M04 inspect")).toBeInTheDocument();

    rerender(
      <CuentaCockpitModuloView codigoCuenta="49M04" modulo="ventas" />,
    );
    expect(screen.getByText("ventas 49M04 inspect")).toBeInTheDocument();

    rerender(
      <CuentaCockpitModuloView codigoCuenta="49M04" modulo="transporte" />,
    );
    expect(screen.getByText("transporte 49M04 inspect")).toBeInTheDocument();

    rerender(
      <CuentaCockpitModuloView codigoCuenta="49M04" modulo="reportes" />,
    );
    expect(screen.getByText("reportes 49M04 inspect")).toBeInTheDocument();
  });
});
