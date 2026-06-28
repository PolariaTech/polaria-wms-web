import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/roles";
import type { AuthSession } from "@/types/auth";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/dashboard/ingreso",
}));

const listSolicitudesCompra = vi.fn();
const listOrdenesCompra = vi.fn();
const listRecepciones = vi.fn();
const listSolicitudesProcesamiento = vi.fn();
const listTareasCola = vi.fn();
const listOrdenesVenta = vi.fn();
const listGuiasEnvio = vi.fn();
const listEvidenciasTransporte = vi.fn();
const listAuditoriaOperacion = vi.fn();
const getInventarioMercanciaReport = vi.fn();
const listWarehouseState = vi.fn();

vi.mock("@/modules/purchases/services/purchases.service", () => ({
  listSolicitudesCompra: (...args: unknown[]) => listSolicitudesCompra(...args),
  listOrdenesCompra: (...args: unknown[]) => listOrdenesCompra(...args),
  listRecepciones: (...args: unknown[]) => listRecepciones(...args),
}));

vi.mock("@/modules/processing/services/processing.service", () => ({
  listSolicitudesProcesamiento: (...args: unknown[]) =>
    listSolicitudesProcesamiento(...args),
  listTareasCola: (...args: unknown[]) => listTareasCola(...args),
}));

vi.mock("@/modules/sales/services/sales.service", () => ({
  listOrdenesVenta: (...args: unknown[]) => listOrdenesVenta(...args),
}));

vi.mock("@/modules/transport/services/transport.service", () => ({
  listGuiasEnvio: (...args: unknown[]) => listGuiasEnvio(...args),
  listEvidenciasTransporte: (...args: unknown[]) =>
    listEvidenciasTransporte(...args),
}));

vi.mock("@/modules/audit", () => ({
  listAuditoriaOperacion: (...args: unknown[]) =>
    listAuditoriaOperacion(...args),
}));

vi.mock(
  "@/modules/admin-panel/services/inventario-mercancia-report.service",
  () => ({
    getInventarioMercanciaReport: (...args: unknown[]) =>
      getInventarioMercanciaReport(...args),
    formatInventarioKg: (kg: number) =>
      kg.toLocaleString("es-CO", { maximumFractionDigits: 3 }),
    getInventarioEtapa: (
      report: {
        etapas: { id: string; kg: number; label: string }[];
      },
      id: string,
    ) => report.etapas.find((etapa) => etapa.id === id) ?? { id, label: id, kg: 0 },
    getInventarioEtapaDestacada: () => "bodega_externa",
  }),
);

vi.mock("@/modules/inventory/services/inventory.service", () => ({
  listWarehouseState: (...args: unknown[]) => listWarehouseState(...args),
}));

const getDomainSupabaseClient = vi.fn();

vi.mock("@/lib/supabase/domain-query", () => ({
  getDomainSupabaseClient: () => getDomainSupabaseClient(),
}));

let mockSession: AuthSession | null = null;
let mockAccessToken: string | null = "token";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: {
      session: AuthSession | null;
      context: AuthSession | null;
      isHydrated: boolean;
      accessToken: string | null;
    }) => unknown,
  ) =>
    selector({
      session: mockSession,
      context: null,
      isHydrated: true,
      accessToken: mockAccessToken,
    }),
}));

vi.mock("@/providers/CompanyProvider", () => ({
  useCompany: () => ({
    codigoCuenta: "CUENTA-01",
    activeBodegaId: "BOD-01",
    idBodegas: ["BOD-01"],
    hasMultipleBodegas: false,
    setActiveBodegaId: vi.fn(),
    scope: "tenant" as const,
    codigoEmpresa: "ACME",
    nivelRol: mockSession?.nivelRol ?? "bodega",
  }),
  TenantBodegaSelector: () => null,
}));

const baseSession: AuthSession = {
  idUsuario: "user-1",
  idAuth: "auth-1",
  nombre: "Usuario",
  username: "user.acme",
  correo: "user@acme.com",
  idRol: WmsRol.operario,
  nombreRol: "Operario",
  nivelRol: "bodega",
  codigoEmpresa: "ACME",
  razonSocialEmpresa: "ACME Corp",
  codigoCuenta: "CUENTA-01",
  nombreComercialCuenta: "ACME Comercial",
  idBodegas: ["BOD-01"],
  scope: "tenant",
};

function createRealtimeMock() {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((callback?: (status: string) => void) => {
      queueMicrotask(() => callback?.("SUBSCRIBED"));
      return channel;
    }),
  };

  return {
    client: {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    },
    channel,
  };
}

import DashboardIngresoPage from "@/app/(shell)/dashboard/ingreso/page";
import DashboardComprasPage from "@/app/(shell)/dashboard/compras/page";
import DashboardIntegracionCuentaPage from "@/app/(shell)/dashboard/integracion-cuenta/page";
import DashboardMapaPage from "@/app/(shell)/dashboard/mapa/page";
import DashboardProcesamientoPage from "@/app/(shell)/dashboard/procesamiento/page";
import DashboardVentasPage from "@/app/(shell)/dashboard/ventas/page";
import DashboardTransportePage from "@/app/(shell)/dashboard/transporte/page";
import DashboardReporteriaPage from "@/app/(shell)/dashboard/reporteria/page";

describe("vistas operativas dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = { ...baseSession };
    mockAccessToken = "token";

    listSolicitudesCompra.mockResolvedValue([]);
    listOrdenesCompra.mockResolvedValue([]);
    listRecepciones.mockResolvedValue([]);
    listSolicitudesProcesamiento.mockResolvedValue([]);
    listTareasCola.mockResolvedValue([]);
    listOrdenesVenta.mockResolvedValue([]);
    listGuiasEnvio.mockResolvedValue([]);
    listEvidenciasTransporte.mockResolvedValue([]);
    listAuditoriaOperacion.mockResolvedValue([]);
    getInventarioMercanciaReport.mockResolvedValue({
      etapas: [
        { id: "proveedor", label: "Proveedor", kg: 0 },
        { id: "transporte", label: "Transporte", kg: 0 },
        { id: "bodega_interna", label: "Bodega interna", kg: 0 },
        { id: "bodega_externa", label: "Bodega externa", kg: 7884 },
        { id: "ventas", label: "Ventas", kg: 0 },
      ],
    });
    listWarehouseState.mockResolvedValue([]);

    const realtime = createRealtimeMock();
    getDomainSupabaseClient.mockReturnValue(realtime.client);
  });

  it("ingreso renderiza recepciones con permiso de bodega", async () => {
    render(<DashboardIngresoPage />);

    expect(screen.getByRole("heading", { name: "Ingreso" })).toBeInTheDocument();
    expect(screen.getByText("Recepciones de compra")).toBeInTheDocument();

    await waitFor(() => {
      expect(listRecepciones).toHaveBeenCalled();
    });

    expect(listSolicitudesCompra).not.toHaveBeenCalled();
    expect(listOrdenesCompra).not.toHaveBeenCalled();
  });

  it("compras renderiza solicitudes y órdenes para administrador de cuenta", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.administrador_cuenta,
      nombreRol: "Administrador de cuenta",
      nivelRol: "cuenta",
    };

    render(<DashboardComprasPage />);

    expect(screen.getByRole("heading", { name: "Compras" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Solicitudes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Órdenes" })).toBeInTheDocument();

    await waitFor(() => {
      expect(listSolicitudesCompra).toHaveBeenCalled();
    });
  });

  it("mapa renderiza tabla de inventario para operario de bodega", async () => {
    render(<DashboardMapaPage />);

    expect(
      screen.getByRole("heading", { name: "Mapa de inventario" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(listWarehouseState).toHaveBeenCalled();
    });
  });

  it("bloquea ingreso para administrador de cuenta", () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.administrador_cuenta,
      nombreRol: "Administrador de cuenta",
      nivelRol: "cuenta",
    };

    render(<DashboardIngresoPage />);

    expect(
      screen.getByText(/No tienes permiso para acceder a este módulo operativo/i),
    ).toBeInTheDocument();
    expect(listRecepciones).not.toHaveBeenCalled();
  });

  it("bloquea mapa para administrador de cuenta", () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.administrador_cuenta,
      nombreRol: "Administrador de cuenta",
      nivelRol: "cuenta",
    };

    render(<DashboardMapaPage />);

    expect(
      screen.getByText(/No tienes permiso para consultar el inventario de esta bodega/i),
    ).toBeInTheDocument();
    expect(listWarehouseState).not.toHaveBeenCalled();
  });

  it("integracion cuenta renderiza placeholder para operador de cuenta", () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.operador_cuenta,
      nombreRol: "Operador de cuenta",
      nivelRol: "cuenta",
    };

    render(<DashboardIntegracionCuentaPage />);

    expect(
      screen.getByRole("heading", { name: "Bodega externa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Próximamente: flujos de integración con bodega externa/i),
    ).toBeInTheDocument();
  });

  it("procesamiento renderiza solicitudes y tareas para procesador", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.procesador,
      nombreRol: "Procesador",
    };

    render(<DashboardProcesamientoPage />);

    expect(
      screen.getByRole("heading", { name: "Procesamiento" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(listSolicitudesProcesamiento).toHaveBeenCalled();
      expect(listTareasCola).toHaveBeenCalled();
    });
  });

  it("ventas renderiza órdenes para administrador de cuenta", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.administrador_cuenta,
      nombreRol: "Administrador de cuenta",
      nivelRol: "cuenta",
    };

    render(<DashboardVentasPage />);

    expect(screen.getByRole("heading", { name: "Ventas" })).toBeInTheDocument();

    await waitFor(() => {
      expect(listOrdenesVenta).toHaveBeenCalled();
    });
  });

  it("transporte renderiza guías para transportista", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.transportista,
      nombreRol: "Transportista",
    };

    render(<DashboardTransportePage />);

    expect(
      screen.getByRole("heading", { name: "Transporte" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(listGuiasEnvio).toHaveBeenCalled();
      expect(listEvidenciasTransporte).toHaveBeenCalled();
    });
  });

  it("reportería renderiza inventario de mercancía", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.administrador_cuenta,
      nombreRol: "Administrador de cuenta",
      nivelRol: "empresa",
    };

    render(<DashboardReporteriaPage />);

    expect(
      screen.getByRole("heading", { name: "Reportes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Inventario de mercancía")).toBeInTheDocument();

    await waitFor(() => {
      expect(getInventarioMercanciaReport).toHaveBeenCalledWith("CUENTA-01");
      expect(screen.getByText(/Bodega externa/i)).toBeInTheDocument();
    });
  });

  it("bloquea procesamiento sin rol autorizado", () => {
    mockSession = { ...baseSession, idRol: WmsRol.operario };

    render(<DashboardProcesamientoPage />);

    expect(
      screen.getByText(/No tienes permiso para acceder a este módulo operativo/i),
    ).toBeInTheDocument();
    expect(listSolicitudesProcesamiento).not.toHaveBeenCalled();
  });

  it("muestra estado vacío cuando no hay filas", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.administrador_cuenta,
      nivelRol: "cuenta",
    };

    render(<DashboardVentasPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Sin órdenes de venta registradas."),
      ).toBeInTheDocument();
    });
  });
});
