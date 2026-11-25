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
  mockReplace,
} from "./operational-pages.test-helpers";
import DashboardIngresoPage from "@/app/(shell)/dashboard/ingreso/page";
import DashboardComprasPage from "@/app/(shell)/dashboard/(operacion-cuenta)/compras/page";
import DashboardBodegaExternaCuentaPage from "@/app/(shell)/dashboard/(operacion-cuenta)/bodega-externa/page";
import DashboardBodegaExternaCuentaIntegracionPage from "@/app/(shell)/dashboard/(operacion-cuenta)/bodega-externa/integracion/page";
import DashboardBodegaInternaCuentaPage from "@/app/(shell)/dashboard/(operacion-cuenta)/bodega-interna/page";
import DashboardBodegaInternaCuentaProcesamientoPage from "@/app/(shell)/dashboard/(operacion-cuenta)/bodega-interna/procesamiento/page";
import DashboardMapaPage from "@/app/(shell)/dashboard/mapa/page";
import DashboardProcesamientoPage from "@/app/(shell)/dashboard/(operacion-cuenta)/procesamiento/page";
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
  it("ingreso renderiza recepciones con permiso de bodega", async () => {
  authTestState.mockSession = {
  ...baseSession,
  idRol: WmsRol.jefe_bodega,
  nombreRol: "Jefe de bodega",
  };

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
  authTestState.mockSession = {
  ...baseSession,
  idRol: WmsRol.administrador_cuenta,
  nombreRol: "Administrador de cuenta",
  nivelRol: "cuenta",
  };

  render(<DashboardComprasPage />);

  expect(screen.getByRole("heading", { name: "Compras" })).toBeInTheDocument();

  await waitFor(() => {
  expect(screen.getByRole("button", { name: "Solicitudes" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Órdenes" })).toBeInTheDocument();
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
  authTestState.mockSession = {
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
  authTestState.mockSession = {
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
  authTestState.mockSession = {
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
  authTestState.mockSession = {
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
  screen.getByRole("heading", { name: "Solicitudes de integración" }),
  ).toBeInTheDocument();
  expect(
  screen.getByRole("button", { name: "Solicitar integración" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Actualizar tabla")).toBeInTheDocument();

  await waitFor(() => {
  expect(listSolicitudesIntegracion).toHaveBeenCalled();
  expect(screen.getByText("Bodega Norte")).toBeInTheDocument();
  expect(screen.getByText("API")).toBeInTheDocument();
  });
  });

  it("bodega interna muestra opción Procesamiento para operador de cuenta", () => {
  authTestState.mockSession = {
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
  authTestState.mockSession = {
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
  expect(
  screen.getByRole("heading", { name: "Órdenes de procesamiento" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Nueva orden" })).toBeInTheDocument();
  expect(screen.getByLabelText("Actualizar tabla")).toBeInTheDocument();

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
  authTestState.mockSession = {
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
  authTestState.mockSession = {
  ...baseSession,
  idRol: WmsRol.procesador,
  nombreRol: "Procesador",
  };

  render(<DashboardProcesamientoPage />);

  expect(
  screen.getByText(
  "Solicitudes de transformación y tareas operativas en cola.",
  ),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { name: "Procesamiento" }).length).toBeGreaterThan(0);

  await waitFor(() => {
  expect(listSolicitudesProcesamientoOperador).toHaveBeenCalled();
  });
  expect(listSolicitudesProcesamiento).not.toHaveBeenCalled();
  expect(listTareasCola).not.toHaveBeenCalled();
  });

  it("ventas redirige al operador de cuenta a órdenes de venta", async () => {
  authTestState.mockSession = {
  ...baseSession,
  idRol: WmsRol.operador_cuenta,
  nombreRol: "Operador de cuenta",
  nivelRol: "cuenta",
  };

  const { container } = render(<DashboardVentasPage />);

  expect(container).toBeEmptyDOMElement();
  await waitFor(() => {
  expect(mockReplace).toHaveBeenCalledWith("/dashboard/ventas/ordenes");
  });
  expect(listOrdenesVenta).not.toHaveBeenCalled();
  });
});