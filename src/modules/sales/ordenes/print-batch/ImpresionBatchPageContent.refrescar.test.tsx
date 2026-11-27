import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";

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
  useAdminMaestroScope: () => ({
    codigoCuenta: "JBR",
    inspect: false,
    runScoped: <T,>(fn: () => Promise<T>) => fn(),
  }),
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
vi.mock("./cargar-hojas-batch", () => ({
  cargarHojasBatch: vi.fn().mockResolvedValue([]),
  cargarCentrosConsumo: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/modules/configurator/impresoras/services/impresoras.service", () => ({
  getImpresoraActivaCuenta: () => Promise.resolve({ nombre: "Brother cocina" }),
}));
vi.mock("../services/orden-venta-log.client", () => ({
  postOrdenVentaLogForOts: vi.fn().mockResolvedValue(undefined),
  fetchOrdenVentaLog: vi.fn().mockResolvedValue([]),
}));

import { ImpresionBatchPageContent } from "./ImpresionBatchPageContent";

function ov(id: string, comprador: string): OrdenVentaOperadorRow {
  return {
    idOrdenVenta: id,
    venta: `OV-${id}`,
    occ: "",
    occTodas: [],
    cuenta: "JBR",
    comprador,
    productos: "—",
    cantidadKg: 0,
    total: 0,
    estado: "confirmada",
    fecha: "2026-11-01",
    fechaEntrega: "2026-11-06",
    ordenesTrabajo: 1,
    destino: "—",
    idBodega: "b1",
    idBodegaDestino: null,
    slaStatus: "en_tiempo",
    alertaStatus: "ok",
    minutosEnEstado: 0,
    slaMinutos: 60,
    alertaMinutos: 45,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  listOrdenes.mockResolvedValue([ov("a", "Hotel Sol"), ov("b", "Hotel Luna")]);
});

describe("ImpresionBatchPageContent · botón de refrescar (REQ-434)", () => {
  it("vuelve a leer la lista al pulsar «Actualizar lista»", async () => {
    render(<ImpresionBatchPageContent />);
    expect(await screen.findByText("OV-a")).toBeInTheDocument();
    expect(listOrdenes).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Actualizar lista" }));

    await waitFor(() => expect(listOrdenes).toHaveBeenCalledTimes(2));
  });

  it("conserva el filtro de búsqueda y muestra lo nuevo que llegó", async () => {
    render(<ImpresionBatchPageContent />);
    expect(await screen.findByText("OV-b")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Buscar"), "Luna");
    expect(screen.queryByText("OV-a")).toBeNull();

    listOrdenes.mockResolvedValue([ov("a", "Hotel Sol"), ov("b", "Hotel Luna"), ov("c", "Hotel Luna Norte")]);
    await userEvent.click(screen.getByRole("button", { name: "Actualizar lista" }));

    expect(await screen.findByText("OV-c")).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar")).toHaveValue("Luna");
    expect(screen.queryByText("OV-a")).toBeNull();
  });
});
