import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOrdenVentaCypherDrawerContent } from "./use-orden-venta-cypher-drawer-content";

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
  useCypherDrawerPanelMount: () => ({ panelMounted: false, panelEntered: false }),
}));

vi.mock("./cypher-drawer-orden-load", () => ({
  useCypherDrawerOrdenLoad: () => ({
    orden: null,
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
  useCuentaZonaHoraria: () => "America/Bogota",
}));

describe("useOrdenVentaCypherDrawerContent", () => {
  it("sin OV abierta no monta el panel", () => {
    const { result } = renderHook(() =>
      useOrdenVentaCypherDrawerContent({
        idOrdenVenta: null,
        codigoCuenta: null,
        row: null,
        busyKind: null,
        onClose: vi.fn(),
        onEdit: vi.fn(),
        onPrint: vi.fn(),
        onPreview: vi.fn(),
        onFotos: vi.fn(),
      }),
    );

    expect(result.current.panelMounted).toBe(false);
    expect(result.current.open).toBe(false);
  });
});
