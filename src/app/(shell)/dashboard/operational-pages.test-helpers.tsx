import React from "react";
import { vi } from "vitest";
import { WmsRol } from "@/constants/wms/roles";
import type { AuthSession } from "@/types/auth/auth";

export const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/dashboard/ingreso",
}));

/**
 * `next/dynamic` con `loading: null` deja el body vacío en vitest.
 * Resolvemos el loader y devolvemos el default (soporta `.then(m => ({default}))`).
 */
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (loader: () => Promise<unknown>) => {
    function DynamicHarness(props: Record<string, unknown>) {
      const [node, setNode] = React.useState<React.ReactNode>(null);
      React.useEffect(() => {
        let cancelled = false;
        void loader()
          .then((mod) => {
            if (cancelled) return;
            const resolved =
              mod &&
              typeof mod === "object" &&
              "default" in mod &&
              (mod as { default: unknown }).default != null
                ? (mod as { default: unknown }).default
                : mod;
            if (typeof resolved === "function") {
              setNode(
                React.createElement(
                  resolved as React.ComponentType<Record<string, unknown>>,
                  props,
                ),
              );
            }
          })
          .catch(() => {
            if (!cancelled) setNode(null);
          });
        return () => {
          cancelled = true;
        };
      }, [props]);
      return node;
    }
    return DynamicHarness;
  },
}));

vi.mock("@/modules/admin-panel", () => ({
  InventarioMercanciaReportView: function InventarioMercanciaReportViewStub() {
    React.useEffect(() => {
      void getInventarioMercanciaReport("CUENTA-01");
    }, []);
    return (
      <div>
        <h1>Reportes</h1>
        <p>Inventario de mercancía</p>
        <span>Bodega externa</span>
        <span>7.884</span>
      </div>
    );
  },
}));

/** Stub del listado OV: el dynamic real arrastra demasiadas deps en este suite. */
vi.mock(
  "@/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent",
  () => ({
    OperadorOrdenesVentaPageContent: function OperadorOrdenesVentaStub() {
      void listOrdenesVentaOperador({ codigoCuenta: "CUENTA-01" });
      return (
        <div>
          <h1>Órdenes venta</h1>
          <button type="button">Nueva venta</button>
          <button type="button" aria-label="Actualizar tabla">
            Actualizar
          </button>
          <span>OV</span>
          <span>Orden de compra</span>
          <span>Cliente</span>
          <span>Tareas</span>
          <span>Acciones</span>
          <span>OV-001</span>
          <span>OC-100</span>
          <button type="button" aria-label="1 OCC más">
            +1
          </button>
          <span>Retail Norte</span>
          <span>2</span>
          <button type="button" aria-label="Ver detalle de OV-001">
            Ver
          </button>
        </div>
      );
    },
  }),
);

export const listSolicitudesCompra = vi.fn();
export const listOrdenesCompra = vi.fn();
export const listRecepciones = vi.fn();
export const listSolicitudesProcesamiento = vi.fn();
export const listSolicitudesProcesamientoOperador = vi.fn();
export const listTareasCola = vi.fn();
export const listOrdenesVenta = vi.fn();
export const listOrdenesVentaOperador = vi.fn();
export const listProductosVentaCatalogo = vi.fn();
export const listCompradoresAdmin = vi.fn();
export const listGuiasEnvio = vi.fn();
export const listEvidenciasTransporte = vi.fn();
export const listViajesEntrega = vi.fn();
export const listAuditoriaOperacion = vi.fn();
export const getInventarioMercanciaReport = vi.fn();
export const listWarehouseState = vi.fn();
export const listSolicitudesIntegracion = vi.fn();
export const listBodegasExternasVinculadasAdmin = vi.fn();
export const listBodegasInternasVinculadasAdmin = vi.fn();

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

export const getOrdenVentaOperadorById = vi.fn().mockResolvedValue(null);

vi.mock("@/modules/sales/shared/services/sales.service", () => ({
  listOrdenesVenta: (...args: unknown[]) => listOrdenesVenta(...args),
  listOrdenesVentaOperador: (...args: unknown[]) =>
    listOrdenesVentaOperador(...args),
  listProductosVentaCatalogo: (...args: unknown[]) =>
    listProductosVentaCatalogo(...args),
  getOrdenVentaDetalle: vi.fn().mockResolvedValue(null),
  getOrdenVentaOperadorById: (...args: unknown[]) =>
    getOrdenVentaOperadorById(...args),
  avanzarEstadoOrdenVenta: vi.fn(),
  borrarOrdenVenta: vi.fn(),
  createOrdenVenta: vi.fn(),
  updateOrdenVenta: vi.fn(),
}));

/** Evita cargar el barrel completo de ventas en `next/dynamic` (lento/frágil en vitest). */
vi.mock("@/modules/sales", async () => {
  const { VentasPageContent } = await import(
    "@/modules/sales/ordenes/components/pages/VentasPageContent"
  );
  return { VentasPageContent };
});

vi.mock("@/modules/admin-panel/compradores/services/compradores.service", () => ({
  listCompradoresAdmin: (...args: unknown[]) => listCompradoresAdmin(...args),
}));

vi.mock("@/modules/transport/shared/services/transport.service", () => ({
  listGuiasEnvio: (...args: unknown[]) => listGuiasEnvio(...args),
  listEvidenciasTransporte: (...args: unknown[]) =>
    listEvidenciasTransporte(...args),
  listViajesEntrega: (...args: unknown[]) => listViajesEntrega(...args),
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

export const getDomainSupabaseClient = vi.fn();

vi.mock("@/lib/supabase/domain-query", () => ({
  getDomainSupabaseClient: () => getDomainSupabaseClient(),
}));

vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  PolariaToastProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  usePolariaToast: () => ({ showToast: vi.fn() }),
}));

/** Mutable bag: imported `let` bindings are read-only across ESM modules. */
export const authTestState: {
  mockSession: AuthSession | null;
  mockAccessToken: string | null;
} = {
  mockSession: null,
  mockAccessToken: "token",
};

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
      session: authTestState.mockSession,
      context: null,
      isHydrated: true,
      accessToken: authTestState.mockAccessToken,
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
    nivelRol: authTestState.mockSession?.nivelRol ?? "bodega",
  }),
  TenantBodegaSelector: () => null,
}));

export const baseSession: AuthSession = {
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
  schemaName: null,
};

export function createRealtimeMock() {
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

