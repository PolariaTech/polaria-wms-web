import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";

const listOrdenes = vi.fn();
const fetchLog = vi.fn();

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
  fetchOrdenVentaLog: (...args: unknown[]) => fetchLog(...args),
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
  listOrdenes.mockResolvedValue([
    ov("a", "Hotel Sol"),
    ov("b", "Hotel Sol"),
    ov("c", "Hotel Luna"),
    ov("d", "Hotel Luna"),
    ov("e", "Hotel Luna"),
  ]);
  // Impresas: «a» (Hotel Sol) y «c» (Hotel Luna).
  fetchLog.mockImplementation(async ({ idOrdenVenta }: { idOrdenVenta: string }) =>
    idOrdenVenta === "a" || idOrdenVenta === "c" ? [{ payloadTipo: "impresion_pdf" }] : [],
  );
});

describe("ImpresionBatchPageContent · totales de «Estado de impresión» (REQ-432)", () => {
  it("al filtrar, los tres totales se refieren solo a lo que dejan pasar los demás filtros", async () => {
    render(<ImpresionBatchPageContent />);
    expect(await screen.findByRole("button", { name: "Ya impresas (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todas (5)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sin imprimir (3)" })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Cliente"), "Hotel Sol");

    expect(await screen.findByRole("button", { name: "Todas (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sin imprimir (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ya impresas (1)" })).toBeInTheDocument();
  });

  it("los totales siguen mostrando el día completo aunque se elija «Sin imprimir»", async () => {
    render(<ImpresionBatchPageContent />);
    await screen.findByRole("button", { name: "Ya impresas (2)" });
    await userEvent.selectOptions(screen.getByLabelText("Cliente"), "Hotel Luna");

    await userEvent.click(screen.getByRole("button", { name: /^Sin imprimir/ }));

    expect(screen.getByRole("button", { name: "Todas (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sin imprimir (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ya impresas (1)" })).toBeInTheDocument();
  });
});
