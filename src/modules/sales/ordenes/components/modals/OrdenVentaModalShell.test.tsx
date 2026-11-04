import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";
import { OrdenVentaModalShell } from "./OrdenVentaModalShell";
import { tooltipGuardarAvanceVenta } from "./orden-venta-footer-icon-tooltips";

// El cuerpo y las ventanas auxiliares tienen sus propias pruebas: aquí solo importa el marco.
vi.mock("./OrdenVentaDiscrepanciasDialog", () => ({
  OrdenVentaModalCuerpo: () => <p>cuerpo del modal</p>,
  OrdenVentaModalOverlays: () => null,
}));
vi.mock("@/components/mateo/MateoIaLoadingScreen", () => ({
  MateoIaLoadingScreen: () => null,
}));
vi.mock("./OrdenVentaFormFooterCenter", () => ({
  OrdenVentaFormFooterCenter: () => null,
}));

const GUARDAR = tooltipGuardarAvanceVenta();

/** Estado del formulario con lo que el marco consulta; el resto son espías. */
function estadoShell(parcial: Record<string, unknown> = {}) {
  const espias: Record<string, ReturnType<typeof vi.fn>> = {};
  const datos: Record<string, unknown> = {
    open: true,
    showMateoLoading: false,
    requestClose: vi.fn(),
    formScrollRef: { current: null },
    step: "form",
    isEditing: false,
    folioVisible: "",
    formDescription: "Captura el pedido",
    startMode: "scratch",
    submitIntentRef: { current: "emit" },
    handleSubmit: vi.fn(),
    error: null,
    isSaving: false,
    isLoading: false,
    hasProductos: true,
    hasCatalogPending: false,
    lineas: [{ idProducto: "p1", catalogPending: false }],
    idComprador: "c1",
    pendingEmitId: null,
    editingEstado: null,
    cypherOpen: false,
    onToggleCypher: undefined,
    paginarPorOt: false,
    hijaFormActiva: null,
    formOtSafePage: 0,
    ordenesTrabajoForm: [],
    previewHijas: [],
    picker: null,
    isCompradorCreateOpen: false,
    confirmDiscrepanciasOpen: false,
    confirmSaveOpen: false,
    confirmDiscardOpen: false,
    addOtOpen: false,
    confirmRemoveOtId: null,
    confirmSubmitDisabled: false,
    setConfirmRemoveOtId: vi.fn(),
    ...parcial,
  };
  const estado = new Proxy(datos, {
    get: (destino, clave: string) => (clave in destino ? destino[clave] : (espias[clave] ??= vi.fn())),
  }) as unknown as OrdenVentaFormEstado;
  return { estado, datos };
}

describe("OrdenVentaModalShell — pie y encabezado (REQ-199 / REQ-232)", () => {
  it("el formulario lleva «Guardar avance» en el pie y no en el encabezado", () => {
    const { estado } = estadoShell();
    render(<OrdenVentaModalShell estado={estado} />);

    const dialogo = screen.getByRole("dialog");
    expect(within(dialogo).getAllByRole("button", { name: /Guardar avance/ })).toHaveLength(1);
    const guardar = within(dialogo).getByRole("button", { name: /Guardar avance/ });
    // en el pie: comparte contenedor con «Cancelar», a su izquierda; el encabezado ya no lo trae
    const cancelar = within(dialogo).getByRole("button", { name: "Cancelar" });
    expect(cancelar.parentElement).toContainElement(guardar);
    expect(guardar.compareDocumentPosition(cancelar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(guardar).toHaveAttribute("title", GUARDAR);
  });

  it("guardar avance marca la intención «draft» y envía el formulario", async () => {
    const user = userEvent.setup();
    const { estado, datos } = estadoShell({ isEditing: true });
    render(<OrdenVentaModalShell estado={estado} />);

    await user.click(screen.getByRole("button", { name: /Guardar avance/ }));

    expect((datos.submitIntentRef as { current: string }).current).toBe("draft");
    expect(datos.handleSubmit).toHaveBeenCalledOnce();
  });

  it("en una alta nueva sin cliente ni productos de catálogo no se puede guardar el avance", () => {
    const { estado } = estadoShell({ idComprador: "", lineas: [] });
    render(<OrdenVentaModalShell estado={estado} />);

    expect(screen.getByRole("button", { name: /Guardar avance/ })).toBeDisabled();
  });

  it("una OV ya abierta siempre puede guardar el avance (REQ-134)", () => {
    const { estado } = estadoShell({ isEditing: true, idComprador: "", lineas: [] });
    render(<OrdenVentaModalShell estado={estado} />);

    expect(screen.getByRole("button", { name: /Guardar avance/ })).toBeEnabled();
  });

  it("con una tarea activa ofrece eliminarla desde el pie, con su número de OT", async () => {
    const user = userEvent.setup();
    const setConfirmRemoveOtId = vi.fn();
    const { estado } = estadoShell({
      hijaFormActiva: { id: "ot-7" },
      formOtSafePage: 2,
      setConfirmRemoveOtId,
    });
    render(<OrdenVentaModalShell estado={estado} />);

    await user.click(screen.getByRole("button", { name: /Eliminar esta tarea · OT 3/ }));

    expect(setConfirmRemoveOtId).toHaveBeenCalledWith("ot-7");
  });

  it("sin tarea activa no hay botón de eliminar", () => {
    const { estado } = estadoShell();
    render(<OrdenVentaModalShell estado={estado} />);

    expect(screen.queryByRole("button", { name: /Eliminar esta tarea/ })).not.toBeInTheDocument();
  });

  it("fuera del formulario el pie no trae guardar avance ni eliminar", () => {
    const { estado } = estadoShell({ step: "preview", hijaFormActiva: { id: "ot-1" } });
    render(<OrdenVentaModalShell estado={estado} />);

    expect(screen.queryByRole("button", { name: /Guardar avance/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Eliminar esta tarea/ })).not.toBeInTheDocument();
  });

  it("en edición el título identifica el pedido y no hay subtítulo (REQ-220)", () => {
    const { estado } = estadoShell({ isEditing: true, folioVisible: "OV-00001395" });
    render(<OrdenVentaModalShell estado={estado} />);

    expect(screen.getByRole("heading", { name: "Editar · OV-00001395" })).toBeInTheDocument();
    expect(screen.queryByText(/actualiza los datos del pedido/i)).not.toBeInTheDocument();
  });

  it("en una alta nueva el subtítulo es la descripción del formulario", () => {
    const { estado } = estadoShell();
    render(<OrdenVentaModalShell estado={estado} />);

    expect(screen.getByRole("heading", { name: "Pedido" })).toBeInTheDocument();
    expect(screen.getByText("Captura el pedido")).toBeInTheDocument();
  });
});

describe("OrdenVentaModalShell — botón de Cypher (REQ-199)", () => {
  const ABRIR = { name: "Abrir detalle Cypher" };

  it("con un borrador ya creado se puede abrir Cypher aunque no se esté editando", async () => {
    const user = userEvent.setup();
    const onToggleCypher = vi.fn();
    const { estado } = estadoShell({ pendingEmitId: "ov-1", onToggleCypher });
    render(<OrdenVentaModalShell estado={estado} />);

    await user.click(screen.getByRole("button", ABRIR));

    expect(onToggleCypher).toHaveBeenCalledOnce();
  });

  it("una alta nueva sin id todavía no ofrece Cypher", () => {
    const { estado } = estadoShell({ onToggleCypher: vi.fn() });
    render(<OrdenVentaModalShell estado={estado} />);

    expect(screen.queryByRole("button", ABRIR)).not.toBeInTheDocument();
  });

  it("con Cypher ya abierto no repite el botón", () => {
    const { estado } = estadoShell({ isEditing: true, cypherOpen: true, onToggleCypher: vi.fn() });
    render(<OrdenVentaModalShell estado={estado} />);

    expect(screen.queryByRole("button", ABRIR)).not.toBeInTheDocument();
  });
});
