/* eslint-disable @typescript-eslint/no-explicit-any -- capturas de props de mocks */
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import type { OvPaneles } from "../../hooks/use-ov-paneles";
import {
  OperadorOrdenesVentaCypher,
  type OperadorOrdenesVentaCypherProps,
} from "./OperadorOrdenesVentaCypher";

let drawerProps: Record<string, any> = {};
vi.mock("../modals/OrdenVentaCypherDrawer", () => ({
  OrdenVentaCypherDrawer: (p: Record<string, unknown>) => {
    drawerProps = p;
    return null;
  },
}));

const fila = (id: string, estado: string) =>
  ({ idOrdenVenta: id, estado }) as unknown as OrdenVentaOperadorRow;

function armar(
  parcial: { cypherId?: string | null; rows?: OrdenVentaOperadorRow[]; inspect?: boolean; detalleId?: string | null } = {},
) {
  const paneles = {
    cypherId: "cypherId" in parcial ? parcial.cypherId : "ov-1",
    detalleId: parcial.detalleId ?? null,
    isCreateOpen: false,
    companionWithCypher: true,
    companionOtPicker: null,
    companionIdComprador: "cli-1",
    formularioDelCypherRef: { current: false },
    editLock: { prepareOpenEdit: vi.fn().mockResolvedValue({ soloLectura: false }) },
    setCypherId: vi.fn(),
    setCompanionOtPicker: vi.fn(),
    setDetalleId: vi.fn(),
    setEditingId: vi.fn(),
    setIsCreateOpen: vi.fn(),
    setReagruparAlAbrirId: vi.fn(),
    cerrarFormulario: vi.fn(),
  };
  const props = {
    paneles: paneles as unknown as OvPaneles,
    codigoCuenta: "C-1",
    inspect: parcial.inspect ?? false,
    rows: parcial.rows ?? [fila("ov-1", "confirmada")],
    busyAction: null,
    onReload: vi.fn(),
    onBorrar: undefined,
    abrirSeleccionOt: vi.fn(),
    openFotosCaptura: vi.fn(),
    setSeleccionOt: vi.fn(),
    setPdfPreview: vi.fn(),
  } satisfies OperadorOrdenesVentaCypherProps;
  render(<OperadorOrdenesVentaCypher {...props} />);
  return { paneles, props };
}

describe("OperadorOrdenesVentaCypher", () => {
  beforeEach(() => {
    drawerProps = {};
  });

  it("entrega al panel la fila del Cypher y el contexto de acompañamiento", () => {
    armar();
    expect(drawerProps.idOrdenVenta).toBe("ov-1");
    expect(drawerProps.row).toMatchObject({ idOrdenVenta: "ov-1" });
    expect(drawerProps.companionWithEdit).toBe(true);
    expect(drawerProps.companionIdComprador).toBe("cli-1");
  });

  it("en inspección no entrega id de OV al panel", () => {
    armar({ inspect: true });
    expect(drawerProps.idOrdenVenta).toBeNull();
  });

  it("imprimir y descargar piden elegir OT sobre la fila del Cypher", () => {
    const { props } = armar();
    drawerProps.onPrint();
    drawerProps.onPreview();
    expect(props.abrirSeleccionOt).toHaveBeenNthCalledWith(1, props.rows[0], "imprimir");
    expect(props.abrirSeleccionOt).toHaveBeenNthCalledWith(2, props.rows[0], "descargar");
  });

  it("las acciones no aplican a una OV cancelada", () => {
    const { props, paneles } = armar({ rows: [fila("ov-1", "cancelada")] });
    drawerProps.onPrint();
    drawerProps.onPreview();
    drawerProps.onFotos("ot-1");
    drawerProps.onEdit();
    expect(props.abrirSeleccionOt).not.toHaveBeenCalled();
    expect(props.openFotosCaptura).not.toHaveBeenCalled();
    expect(paneles.editLock.prepareOpenEdit).not.toHaveBeenCalled();
  });

  it("onFotos pasa la OT elegida", () => {
    const { props } = armar();
    drawerProps.onFotos("ot-3");
    expect(props.openFotosCaptura).toHaveBeenCalledWith(props.rows[0], "ot-3");
  });

  it("onEdit toma el lock y abre el formulario marcándolo como del Cypher", async () => {
    const { paneles } = armar();
    drawerProps.onEdit();
    await vi.waitFor(() => expect(paneles.setIsCreateOpen).toHaveBeenCalledWith(true));
    expect(paneles.formularioDelCypherRef.current).toBe(true);
    expect(paneles.setDetalleId).toHaveBeenCalledWith(null);
    expect(paneles.setEditingId).toHaveBeenCalledWith("ov-1");
  });

  it("al cerrar cierra lo abierto desde el Cypher y el formulario si lo abrió él", () => {
    const { props, paneles } = armar();
    paneles.formularioDelCypherRef.current = true;
    drawerProps.onClose();
    expect(paneles.setCypherId).toHaveBeenCalledWith(null);
    expect(props.setSeleccionOt).toHaveBeenCalledWith(null);
    expect(props.setPdfPreview).toHaveBeenCalledWith(null);
    expect(paneles.cerrarFormulario).toHaveBeenCalledWith(false);
  });

  it("al cerrar no toca el formulario si no lo abrió el Cypher", () => {
    const { paneles } = armar();
    drawerProps.onClose();
    expect(paneles.cerrarFormulario).not.toHaveBeenCalled();
  });

  it("«Modificar con IA» solo se ofrece cuando la OV puede modificarse desde la lista", () => {
    armar({ rows: [fila("ov-1", "por_confirmar")] });
    expect(typeof drawerProps.onReagruparDesdeLista).toBe("function");
  });

  it("busyKind refleja la acción en curso solo para la OV del Cypher", () => {
    const { props } = armar();
    render(
      <OperadorOrdenesVentaCypher
        {...props}
        busyAction={{ id: "ov-1", kind: "print" }}
      />,
    );
    expect(drawerProps.busyKind).toBe("print");
    render(
      <OperadorOrdenesVentaCypher
        {...props}
        busyAction={{ id: "otra", kind: "print" }}
      />,
    );
    expect(drawerProps.busyKind).toBeNull();
  });
});
