import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { useOrdenVentaCypherDrawerContent } from "./use-orden-venta-cypher-drawer-content";

const ZONA_HORARIA = "America/Bogota";
const OV_CREADA_EN = "2026-11-25T03:15:46.507Z";
const CORREO_RECIBIDO_EN = "2026-11-12T20:27:12.000Z";

let ordenSimulada: unknown = null;

vi.mock("./cypher-drawer-resize", () => ({
  useCypherDrawerResize: () => ({
    cypherWidthMode: "normal",
    isResizingWidth: false,
    handleResizePointerDown: vi.fn(),
    handleResizePointerMove: vi.fn(),
    handleResizePointerUp: vi.fn(),
  }),
}));

vi.mock("./cypher-drawer-panel-mount", () => ({
  useCypherDrawerPanelMount: () => ({ panelMounted: true, panelEntered: true }),
}));

vi.mock("./cypher-drawer-orden-load", () => ({
  useCypherDrawerOrdenLoad: () => ({
    orden: ordenSimulada,
    setOrden: vi.fn(),
    isLoading: false,
    error: null,
    activeStage: "resumen",
    setActiveStage: vi.fn(),
    openStages: {},
    setOpenStages: vi.fn(),
  }),
}));

vi.mock("./cypher-drawer-hijas-ot", () => ({
  useCypherDrawerHijasOt: () => ({
    hijasFromOrden: [],
    activeOtPicker: null,
    idOrdenTrabajoBitacora: null,
  }),
}));

vi.mock("./cypher-drawer-log", () => ({
  useCypherDrawerLog: () => ({ logEntries: [], logLoading: false }),
}));

vi.mock("./cypher-drawer-origen-adjuntos", () => ({
  useCypherDrawerOrigenAdjuntos: () => ({
    cuerpoCompleto: "",
    cuerpoMensaje: "",
    correoChrome: null,
    origenAdjuntosStored: [],
    emlInnerAdjuntos: [],
    emlInnerLoading: false,
    origenAdjuntos: [],
    origenNombres: [],
  }),
}));

vi.mock("./cypher-drawer-scroll-spy", () => ({
  useCypherDrawerScrollSpy: vi.fn(),
}));

vi.mock("./cypher-drawer-estado", () => ({
  useCypherDrawerEstado: () => ({
    estado: "borrador",
    estadosSuperiores: [],
    estadoCambiando: false,
    estadoPendiente: null,
    setEstadoPendiente: vi.fn(),
    cambioEstadoError: null,
    setCambioEstadoError: vi.fn(),
    cambiarEstado: vi.fn(),
    resetEstadoUi: vi.fn(),
  }),
}));

vi.mock("./cypher-drawer-stages-nav", () => ({
  useCypherDrawerStagesNav: () => ({
    scrollToStage: vi.fn(),
    toggleAccordionStage: vi.fn(),
  }),
}));

vi.mock("@/lib/utils/use-body-scroll-lock", () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock("@/hooks/shared/useCenterActiveTab", () => ({
  useCenterActiveTab: vi.fn(),
}));

vi.mock("@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria", () => ({
  useCuentaZonaHoraria: () => ZONA_HORARIA,
}));

function abrirDrawer() {
  return renderHook(() =>
    useOrdenVentaCypherDrawerContent({
      idOrdenVenta: "ov-1",
      codigoCuenta: "CUENTA-01",
      row: null,
      busyKind: null,
      onClose: vi.fn(),
      onEdit: vi.fn(),
      onPrint: vi.fn(),
      onPreview: vi.fn(),
      onFotos: vi.fn(),
    }),
  );
}

describe("useOrdenVentaCypherDrawerContent: recibida (REQ-420)", () => {
  beforeEach(() => {
    ordenSimulada = null;
  });

  it("recibida es la llegada del correo, no la fecha de creación de la OV", () => {
    ordenSimulada = {
      id_orden_venta: "ov-1",
      codigo: "OV-001",
      created_at: OV_CREADA_EN,
      fecha_pedido: "2026-11-25",
      recibido_correo_en: CORREO_RECIBIDO_EN,
      lineas: [],
    };

    const { result } = abrirDrawer();

    expect(result.current.recibida).toBe(formatDateTime(CORREO_RECIBIDO_EN, ZONA_HORARIA));
    expect(result.current.recibida).not.toBe(formatDateTime(OV_CREADA_EN, ZONA_HORARIA));
  });

  it("si la OV no vino por correo, recibida queda en «—» y no cae a created_at", () => {
    ordenSimulada = {
      id_orden_venta: "ov-1",
      codigo: "OV-001",
      created_at: OV_CREADA_EN,
      fecha_pedido: "2026-11-25",
      recibido_correo_en: null,
      lineas: [],
    };

    const { result } = abrirDrawer();

    expect(result.current.recibida).toBe("—");
  });
});
