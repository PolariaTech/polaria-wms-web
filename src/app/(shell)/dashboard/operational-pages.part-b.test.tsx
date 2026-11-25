import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/wms/roles";
import {
  authTestState,
  baseSession,
  createRealtimeMock,
  getDomainSupabaseClient,
  getInventarioMercanciaReport,
  listAuditoriaOperacion,
  listBodegasExternasVinculadasAdmin,
  listBodegasInternasVinculadasAdmin,
  listCompradoresAdmin,
  listEvidenciasTransporte,
  listGuiasEnvio,
  listOrdenesCompra,
  listOrdenesVenta,
  listOrdenesVentaOperador,
  listProductosVentaCatalogo,
  listRecepciones,
  listSolicitudesCompra,
  listSolicitudesIntegracion,
  listSolicitudesProcesamiento,
  listSolicitudesProcesamientoOperador,
  listTareasCola,
  listViajesEntrega,
  listWarehouseState,
} from "./operational-pages.test-helpers";
import DashboardProcesamientoPage from "@/app/(shell)/dashboard/(operacion-cuenta)/procesamiento/page";
import DashboardReporteriaPage from "@/app/(shell)/dashboard/reporteria/page";
import DashboardTransportePage from "@/app/(shell)/dashboard/transporte/page";
import DashboardVentasOrdenesPage from "@/app/(shell)/dashboard/(operacion-cuenta)/ventas/ordenes/page";
import DashboardVentasPage from "@/app/(shell)/dashboard/(operacion-cuenta)/ventas/page";

describe("vistas operativas dashboard", () => {
  beforeEach(() => {
  vi.clearAllMocks();
  authTestState.mockSession = { ...baseSession };
  authTestState.mockAccessToken = "token";

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
  listViajesEntrega.mockResolvedValue([]);
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
  it("ordenes venta operador lista columnas esperadas", async () => {
  authTestState.mockSession = {
  ...baseSession,
  idRol: WmsRol.operador_cuenta,
  nombreRol: "Operador de cuenta",
  nivelRol: "cuenta",
  };

  listOrdenesVentaOperador.mockResolvedValue([
  {
  idOrdenVenta: "ov-1",
  venta: "OV-001",
  occ: "OC-100",
  occTodas: ["OC-100", "OC-200"],
  cuenta: "CUENTA-01",
  comprador: "Retail Norte",
  productos: "2 productos",
  cantidadKg: 15,
  total: 2000,
  estado: "confirmada",
  fecha: "2026-06-28T12:00:00.000Z",
  ordenesTrabajo: 2,
  destino: "—",
  idBodega: "bod-1",
  idBodegaDestino: null,
  slaStatus: "en_tiempo",
  alertaStatus: "ok",
  minutosEnEstado: 5,
  slaMinutos: 60,
  alertaMinutos: 45,
  },
  ]);

  render(<DashboardVentasOrdenesPage />);

  expect(
  await screen.findByRole("heading", { name: "Órdenes venta" }),
  ).toBeInTheDocument();
  // REQ-226: sin título/subtítulo duplicados del DataTable ni descripción del shell.
  expect(screen.queryByText("Venta, cliente y estado.")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Nueva venta" })).toBeInTheDocument();
  expect(screen.getByLabelText("Actualizar tabla")).toBeInTheDocument();

  await waitFor(() => {
  expect(screen.getByText("OV")).toBeInTheDocument();
  expect(screen.getByText("Orden de compra")).toBeInTheDocument();
  expect(screen.getByText("Cliente")).toBeInTheDocument();
  expect(screen.getByText("Tareas")).toBeInTheDocument();
  expect(screen.getByText("Acciones")).toBeInTheDocument();
  expect(screen.getByText("OV-001")).toBeInTheDocument();
  expect(screen.getByText("OC-100")).toBeInTheDocument();
  expect(screen.getByLabelText("1 OCC más")).toBeInTheDocument();
  expect(screen.queryByText("OC-200")).not.toBeInTheDocument();
  expect(screen.getByText("Retail Norte")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(
  screen.getByRole("button", { name: "Ver detalle de OV-001" }),
  ).toBeInTheDocument();
  // Descargar PDF vertical solo en NODE_ENV=development (no en vitest).
  });
  });

  it("ventas renderiza órdenes para administrador de cuenta", async () => {
  authTestState.mockSession = {
  ...baseSession,
  idRol: WmsRol.administrador_cuenta,
  nombreRol: "Administrador de cuenta",
  nivelRol: "cuenta",
  };

  render(<DashboardVentasPage />);

  expect(screen.getByRole("heading", { name: "Ventas" })).toBeInTheDocument();

  await waitFor(
    () => {
      expect(listOrdenesVenta).toHaveBeenCalled();
    },
    { timeout: 3000 },
  );
  });

  it("transporte renderiza viajes para transportista", async () => {
  authTestState.mockSession = {
  ...baseSession,
  idRol: WmsRol.transportista,
  nombreRol: "Transportista",
  };

  render(<DashboardTransportePage />);

  expect(
  screen.getByRole("heading", { name: "Transporte" }),
  ).toBeInTheDocument();

  await waitFor(() => {
  expect(listViajesEntrega).toHaveBeenCalled();
  expect(screen.getByText("Viajes de entrega")).toBeInTheDocument();
  expect(screen.getByText("Viaje")).toBeInTheDocument();
  expect(screen.getByText("Kg (venta)")).toBeInTheDocument();
  expect(screen.getByText("Acción")).toBeInTheDocument();
  });
  });

  it("reportería renderiza inventario de mercancía", async () => {
  authTestState.mockSession = {
  ...baseSession,
  idRol: WmsRol.administrador_cuenta,
  nombreRol: "Administrador de cuenta",
  nivelRol: "cuenta",
  };

  render(<DashboardReporteriaPage />);

  expect(
  await screen.findByRole("heading", { name: "Reportes" }),
  ).toBeInTheDocument();

  await waitFor(
    () => {
      expect(screen.getByText("Inventario de mercancía")).toBeInTheDocument();
      expect(getInventarioMercanciaReport).toHaveBeenCalledWith("CUENTA-01");
      expect(screen.getByText(/Bodega externa/i)).toBeInTheDocument();
    },
    { timeout: 5000 },
  );
  });

  it("bloquea procesamiento sin rol autorizado", () => {
  authTestState.mockSession = { ...baseSession, idRol: WmsRol.operario };

  render(<DashboardProcesamientoPage />);

  expect(
  screen.getByText(/No tienes permiso para acceder a este módulo operativo/i),
  ).toBeInTheDocument();
  expect(listSolicitudesProcesamiento).not.toHaveBeenCalled();
  });

  it("muestra estado vacío cuando no hay filas", async () => {
  authTestState.mockSession = {
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