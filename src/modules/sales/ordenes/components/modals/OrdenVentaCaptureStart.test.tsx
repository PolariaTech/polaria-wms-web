import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaCaptureStart } from "./OrdenVentaCaptureStart";

function renderInicio(parcial: Partial<ComponentProps<typeof OrdenVentaCaptureStart>> = {}) {
  const props: ComponentProps<typeof OrdenVentaCaptureStart> = {
    showChoices: false,
    showDocs: false,
    startMode: null,
    isEditing: false,
    onFirstTime: vi.fn(),
    onScratch: vi.fn(),
    onDocs: vi.fn(),
    onBack: vi.fn(),
    compradorLabel: "",
    onSearchCliente: vi.fn(),
    showClientePendiente: false,
    origenTexto: "",
    onOrigenTexto: vi.fn(),
    origenArchivoFiles: [],
    isDocsDropActive: false,
    docsFileInputRef: createRef<HTMLInputElement>(),
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
    onFilesSelected: vi.fn(),
    onRemoveFile: vi.fn(),
    docsHasContent: false,
    ...parcial,
  };
  render(<OrdenVentaCaptureStart {...props} />);
  return props;
}

describe("OrdenVentaCaptureStart — elección inicial", () => {
  it("no pinta nada si no hay que elegir ni capturar documentos", () => {
    renderInicio();

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("ofrece las tres formas de empezar y cada una avisa a su manejador", async () => {
    const user = userEvent.setup();
    const props = renderInicio({ showChoices: true });

    await user.click(screen.getByRole("button", { name: "Registrar comprador" }));
    await user.click(screen.getByRole("button", { name: "Venta nueva" }));
    await user.click(screen.getByRole("button", { name: "Tengo el mensaje o archivos" }));

    expect(props.onFirstTime).toHaveBeenCalledTimes(1);
    expect(props.onScratch).toHaveBeenCalledTimes(1);
    expect(props.onDocs).toHaveBeenCalledTimes(1);
  });

  it("marca como activa la opción que coincide con el modo de inicio", () => {
    renderInicio({ showChoices: true, startMode: "scratch" });

    expect(screen.getByRole("button", { name: "Venta nueva" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Registrar comprador" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("OrdenVentaCaptureStart — mensaje o archivos", () => {
  it("sin contenido pide agregar un mensaje o un archivo", () => {
    renderInicio({ showDocs: true, docsHasContent: false });

    expect(screen.getByText(/Agrega un mensaje o al menos un archivo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Listo para Continuar/i)).not.toBeInTheDocument();
  });

  it("con contenido avisa que Mateo va a leerlo", () => {
    renderInicio({ showDocs: true, docsHasContent: true, origenTexto: "pedido de aguacates" });

    expect(screen.getByText(/Listo para Continuar/i)).toBeInTheDocument();
    expect(screen.getByText("listo")).toBeInTheDocument();
  });

  it("lo que se escribe en el mensaje sube al manejador", async () => {
    const user = userEvent.setup();
    const props = renderInicio({ showDocs: true });

    await user.type(screen.getByPlaceholderText(/Pega aquí el WhatsApp/i), "a");

    expect(props.onOrigenTexto).toHaveBeenCalledWith("a");
  });

  it("«Volver al inicio» aparece solo al crear y regresa a la elección", async () => {
    const user = userEvent.setup();
    const props = renderInicio({ showDocs: true, isEditing: false });

    await user.click(screen.getByRole("button", { name: /Volver al inicio/ }));

    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("al editar no ofrece volver al inicio", () => {
    renderInicio({ showDocs: true, isEditing: true });

    expect(screen.queryByRole("button", { name: /Volver al inicio/ })).not.toBeInTheDocument();
  });

  it("con el cliente pendiente ofrece elegirlo", async () => {
    const user = userEvent.setup();
    const props = renderInicio({ showDocs: true, showClientePendiente: true });

    await user.click(screen.getByRole("button", { name: "Elegir cliente" }));

    expect(props.onSearchCliente).toHaveBeenCalledTimes(1);
  });

  it("sin cliente pendiente no ofrece «Elegir cliente»", () => {
    renderInicio({ showDocs: true, showClientePendiente: false });

    expect(screen.queryByRole("button", { name: "Elegir cliente" })).not.toBeInTheDocument();
  });
});
