import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/wms/roles";
import type { AuthSession } from "@/types/auth/auth";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/dashboard/ingreso",
}));

const listSolicitudesCompra = vi.fn();
const listOrdenesCompra = vi.fn();
const listRecepciones = vi.fn();
const listSolicitudesProcesamiento = vi.fn();
const listSolicitudesProcesamientoOperador = vi.fn();
const listTareasCola = vi.fn();
const listOrdenesVenta = vi.fn();
const listOrdenesVentaOperador = vi.fn();
const listProductosVentaCatalogo = vi.fn();
const listCompradoresAdmin = vi.fn();
const listGuiasEnvio = vi.fn();
const listEvidenciasTransporte = vi.fn();
const listAuditoriaOperacion = vi.fn();
const getInventarioMercanciaReport = vi.fn();
const listWarehouseState = vi.fn();
const listSolicitudesIntegracion = vi.fn();
const listBodegasExternasVinculadasAdmin = vi.fn();
const listBodegasInternasVinculadasAdmin = vi.fn();

vi.mock("@/modules/account-integration/integracion/services/integracion-bodega.service", () => ({
  listSolicitudesIntegracion: (...args: unknown[]) =>
    listSolicitudesIntegracion(...args),
  createSolicitudIntegracion: vi.fn(),
}));

vi.mock("@/modules/admin-panel/bodega-externa/services/bodegas-externas-admin.service", () => ({
  listBodegasExternasVinculadasAdmin: (...args: unknown[]) =>
    listBodegasExternasVinculadasAdmin(...args),
}));

vi.mock("@/modules/admin-panel/bodega-interna/services/bodegas-internas-admin.service", () => ({
  listBodegasInternasVinculadasAdmin: (...args: unknown[]) =>
    listBodegasInternasVinculadasAdmin(...args),
}));

vi.mock("@/modules/purchases/shared/services/purchases.service", () => ({
  listSolicitudesCompra: (...args: unknown[]) => listSolicitudesCompra(...args),
  listOrdenesCompra: (...args: unknown[]) => listOrdenesCompra(...args),
  listRecepciones: (...args: unknown[]) => listRecepciones(...args),
}));

vi.mock("@/modules/processing/shared/services/processing.service", () => ({
  listSolicitudesProcesamiento: (...args: unknown[]) =>
    listSolicitudesProcesamiento(...args),
  listSolicitudesProcesamientoOperador: (...args: unknown[]) =>
    listSolicitudesProcesamientoOperador(...args),
  listTareasCola: (...args: unknown[]) => listTareasCola(...args),
  createSolicitudProcesamiento: vi.fn(),
  listProductosPrimariosProcesamiento: vi.fn().mockResolvedValue([]),
  listProductosSecundariosProcesamiento: vi.fn().mockResolvedValue([]),
  getStockProductoBodega: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/modules/sales/shared/services/sales.service", () => ({
  listOrdenesVenta: (...args: unknown[]) => listOrdenesVenta(...args),
  listOrdenesVentaOperador: (...args: unknown[]) =>
    listOrdenesVentaOperador(...args),
  listProductosVentaCatalogo: (...args: unknown[]) =>
    listProductosVentaCatalogo(...args),
}));

vi.mock("@/modules/admin-panel/compradores/services/compradores.service", () => ({
  listCompradoresAdmin: (...args: unknown[]) => listCompradoresAdmin(...args),
}));

vi.mock("@/modules/transport/shared/services/transport.service", () => ({
  listGuiasEnvio: (...args: unknown[]) => listGuiasEnvio(...args),
  listEvidenciasTransporte: (...args: unknown[]) =>
    listEvidenciasTransporte(...args),
}));

vi.mock("@/modules/audit", () => ({
  listAuditoriaOperacion: (...args: unknown[]) =>
    listAuditoriaOperacion(...args),
}));

vi.mock(
  "@/modules/admin-panel/inventario-mercancia/services/inventario-mercancia-report.service",
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
    getInventarioEtapasConKg: (
      report: { etapas: { id: string; kg: number }[] },
    ) => report.etapas.filter((etapa) => etapa.kg > 0).map((etapa) => etapa.id),
    etapaInventarioPermiteEntrada: (kg: number) => kg > 0,
  }),
);

vi.mock("@/modules/inventory/shared/services/inventory.service", () => ({
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

vi.mock("@/providers/tenant/CompanyProvider", () => ({
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
import DashboardComprasPage from "@/app/(shell)/dashboard/(operacion-cuenta)/compras/page";
import DashboardBodegaExternaCuentaPage from "@/app/(shell)/dashboard/(operacion-cuenta)/bodega-externa/page";
import DashboardBodegaExternaCuentaIntegracionPage from "@/app/(shell)/dashboard/(operacion-cuenta)/bodega-externa/integracion/page";
import DashboardBodegaInternaCuentaPage from "@/app/(shell)/dashboard/(operacion-cuenta)/bodega-interna/page";
import DashboardBodegaInternaCuentaProcesamientoPage from "@/app/(shell)/dashboard/(operacion-cuenta)/bodega-interna/procesamiento/page";
import DashboardMapaPage from "@/app/(shell)/dashboard/mapa/page";
import DashboardProcesamientoPage from "@/app/(shell)/dashboard/(operacion-cuenta)/procesamiento/page";
import DashboardVentasPage from "@/app/(shell)/dashboard/(operacion-cuenta)/ventas/page";
import DashboardVentasOrdenesPage from "@/app/(shell)/dashboard/(operacion-cuenta)/ventas/ordenes/page";
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
    listSolicitudesProcesamientoOperador.mockResolvedValue([]);
    listTareasCola.mockResolvedValue([]);
    listOrdenesVenta.mockResolvedValue([]);
    listOrdenesVentaOperador.mockResolvedValue([]);
    listProductosVentaCatalogo.mockResolvedValue([]);
    listCompradoresAdmin.mockResolvedValue([]);
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
    listSolicitudesIntegracion.mockResolvedValue([]);
    listBodegasExternasVinculadasAdmin.mockResolvedValue([]);
    listBodegasInternasVinculadasAdmin.mockResolvedValue([]);

    const realtime = createRealtimeMock();
    getDomainSupabaseClient.mockReturnValue(realtime.client);
  });

  it("ingreso renderiza recepciones con permiso de bodega", async () => {
    render(<DashboardIngresoPage />);

    expect(screen.getByRole("heading", { name: "Ingreso" })).toBeInTheDocument();
    expect(
      screen.getByText("Órdenes pendientes de recepción"),
    ).toBeInTheDocument();
    expect(screen.getByText("Recepciones de compra")).toBeInTheDocument();

    await waitFor(() => {
      expect(listRecepciones).toHaveBeenCalled();
      expect(listOrdenesCompra).toHaveBeenCalled();
    });

    expect(listSolicitudesCompra).not.toHaveBeenCalled();
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
    expect(listOrdenesCompra).not.toHaveBeenCalled();
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

  it("integracion cuenta muestra opción Integración para operador de cuenta", () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.operador_cuenta,
      nombreRol: "Operador de cuenta",
      nivelRol: "cuenta",
    };

    render(<DashboardBodegaExternaCuentaPage />);

    expect(
      screen.getByRole("heading", { name: "Bodega externa" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Integración" })).toBeInTheDocument();
  });

  it("integracion lista solicitudes para operador de cuenta", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.operador_cuenta,
      nombreRol: "Operador de cuenta",
      nivelRol: "cuenta",
    };

    listSolicitudesIntegracion.mockResolvedValue([
      {
        idSolicitudIntegracion: "sol-1",
        bodegaExternaId: "bod-1",
        bodegaNombre: "Bodega Norte",
        tipoIntegracion: "api",
        estado: "activo",
        createdAt: "2026-06-28T12:00:00.000Z",
      },
    ]);

    render(<DashboardBodegaExternaCuentaIntegracionPage />);

    expect(
      screen.getByRole("heading", { name: "Integración" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Solicitar integración" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(listSolicitudesIntegracion).toHaveBeenCalled();
      expect(screen.getByText("Bodega Norte")).toBeInTheDocument();
      expect(screen.getByText("API")).toBeInTheDocument();
    });
  });

  it("bodega interna muestra opción Procesamiento para operador de cuenta", () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.operador_cuenta,
      nombreRol: "Operador de cuenta",
      nivelRol: "cuenta",
    };

    render(<DashboardBodegaInternaCuentaPage />);

    expect(
      screen.getByRole("heading", { name: "Bodega interna" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Procesamiento" }),
    ).toBeInTheDocument();
  });

  it("procesamiento operador lista órdenes con columnas esperadas", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.operador_cuenta,
      nombreRol: "Operador de cuenta",
      nivelRol: "cuenta",
    };

    listSolicitudesProcesamientoOperador.mockResolvedValue([
      {
        idSolicitudProcesamiento: "sol-1",
        orden: "OP-001",
        primario: "Salmón (SAL-01)",
        secundario: "Filete (FIL-01)",
        insumoPrimario: "10",
        estimSecundario: "20",
        estado: "pendiente",
        fecha: "2026-06-28T12:00:00.000Z",
      },
    ]);

    render(<DashboardBodegaInternaCuentaProcesamientoPage />);

    expect(
      screen.getByRole("heading", { name: "Procesamiento" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva orden" })).toBeInTheDocument();

    await waitFor(() => {
      expect(listSolicitudesProcesamientoOperador).toHaveBeenCalled();
      expect(screen.getByText("Orden")).toBeInTheDocument();
      expect(screen.getByText("Primario")).toBeInTheDocument();
      expect(screen.getByText("Estim. sec.")).toBeInTheDocument();
      expect(screen.getByText("OP-001")).toBeInTheDocument();
      expect(screen.getByText("Salmón (SAL-01)")).toBeInTheDocument();
    });
  });

  it("procesamiento redirige operador de cuenta desde ruta legacy", () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.operador_cuenta,
      nombreRol: "Operador de cuenta",
      nivelRol: "cuenta",
    };

    render(<DashboardProcesamientoPage />);

    expect(mockReplace).toHaveBeenCalledWith(
      "/dashboard/bodega-interna/procesamiento",
    );
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

  it("ventas muestra opción Órdenes venta para operador de cuenta", () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.operador_cuenta,
      nombreRol: "Operador de cuenta",
      nivelRol: "cuenta",
    };

    render(<DashboardVentasPage />);

    expect(screen.getByRole("heading", { name: "Ventas" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Órdenes venta" }),
    ).toBeInTheDocument();
    expect(listOrdenesVenta).not.toHaveBeenCalled();
  });

  it("ordenes venta operador lista columnas esperadas", async () => {
    mockSession = {
      ...baseSession,
      idRol: WmsRol.operador_cuenta,
      nombreRol: "Operador de cuenta",
      nivelRol: "cuenta",
    };

    listOrdenesVentaOperador.mockResolvedValue([
      {
        idOrdenVenta: "ov-1",
        venta: "OV-001",
        cuenta: "CUENTA-01",
        comprador: "Retail Norte",
        productos: "2 productos",
        estado: "borrador",
        fecha: "2026-06-28T12:00:00.000Z",
        destino: "—",
      },
    ]);

    render(<DashboardVentasOrdenesPage />);

    expect(
      screen.getByRole("heading", { name: "Órdenes venta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva venta" })).toBeInTheDocument();

    await waitFor(() => {
      expect(listOrdenesVentaOperador).toHaveBeenCalled();
      expect(screen.getByText("Venta")).toBeInTheDocument();
      expect(screen.getByText("Comprador")).toBeInTheDocument();
      expect(screen.getByText("OV-001")).toBeInTheDocument();
      expect(screen.getByText("Retail Norte")).toBeInTheDocument();
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
