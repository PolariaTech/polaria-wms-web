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
const listWarehouseState = vi.fn();

vi.mock("@/modules/purchases", () => ({
  listSolicitudesCompra: (...args: unknown[]) => listSolicitudesCompra(...args),
  listOrdenesCompra: (...args: unknown[]) => listOrdenesCompra(...args),
  listRecepciones: (...args: unknown[]) => listRecepciones(...args),
}));

vi.mock("@/modules/processing", () => ({
  listSolicitudesProcesamiento: (...args: unknown[]) =>
    listSolicitudesProcesamiento(...args),
  listTareasCola: (...args: unknown[]) => listTareasCola(...args),
}));

vi.mock("@/modules/sales", () => ({
  listOrdenesVenta: (...args: unknown[]) => listOrdenesVenta(...args),
}));

vi.mock("@/modules/transport", () => ({
  listGuiasEnvio: (...args: unknown[]) => listGuiasEnvio(...args),
  listEvidenciasTransporte: (...args: unknown[]) =>
    listEvidenciasTransporte(...args),
}));

vi.mock("@/modules/audit", () => ({
  listAuditoriaOperacion: (...args: unknown[]) =>
    listAuditoriaOperacion(...args),
}));

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
    listWarehouseState.mockResolvedValue([]);

    const realtime = createRealtimeMock();
    getDomainSupabaseClient.mockReturnValue(realtime.client);
  });

  it("ingreso renderiza listas de compras con permiso de bodega", async () => {
    render(<DashboardIngresoPage />);

    expect(screen.getByRole("heading", { name: "Ingreso" })).toBeInTheDocument();
    expect(screen.getByText("Solicitudes de compra")).toBeInTheDocument();

    await waitFor(() => {
      expect(listSolicitudesCompra).toHaveBeenCalled();
      expect(listOrdenesCompra).toHaveBeenCalled();
      expect(listRecepciones).toHaveBeenCalled();
    });
  });

  it("mapa renderiza tabla de inventario con permiso inventory:read", async () => {
    render(<DashboardMapaPage />);

    expect(
      screen.getByRole("heading", { name: "Mapa de inventario" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(listWarehouseState).toHaveBeenCalled();
    });
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

  it("reportería renderiza auditoría con nivel empresa", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.administrador_cuenta,
      nombreRol: "Administrador de cuenta",
      nivelRol: "empresa",
    };

    render(<DashboardReporteriaPage />);

    expect(
      screen.getByRole("heading", { name: "Reportería" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(listAuditoriaOperacion).toHaveBeenCalled();
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
