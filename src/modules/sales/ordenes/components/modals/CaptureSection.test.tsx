import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CaptureDocsArchivos, CaptureSection } from "./CaptureSection";

function archivos(...nombres: string[]): File[] {
  return nombres.map((nombre) => new File(["contenido"], nombre, { type: "application/pdf" }));
}

function renderArchivos(parcial: Partial<Parameters<typeof CaptureDocsArchivos>[0]> = {}) {
  const props = {
    files: [] as File[],
    isDropActive: false,
    inputRef: createRef<HTMLInputElement>(),
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
    onFilesSelected: vi.fn(),
    onRemoveFile: vi.fn(),
    ...parcial,
  };
  render(<CaptureDocsArchivos {...props} />);
  return props;
}

describe("CaptureSection", () => {
  it("muestra el título, lo opcional, el contenido y el pie", () => {
    render(
      <CaptureSection title="Cliente" optional="opcional" footer={<p>pie de la sección</p>}>
        <p>contenido</p>
      </CaptureSection>,
    );

    expect(screen.getByRole("heading", { name: /Cliente/ })).toBeInTheDocument();
    expect(screen.getByText("opcional")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.getByText("pie de la sección")).toBeInTheDocument();
  });

  it("sin «optional» no pinta esa etiqueta", () => {
    render(
      <CaptureSection title="Cliente">
        <p>contenido</p>
      </CaptureSection>,
    );

    expect(screen.queryByText("opcional")).not.toBeInTheDocument();
  });
});

describe("CaptureDocsArchivos", () => {
  it("sin archivos avisa que otros formatos se guardan como respaldo y no cuenta adjuntos", () => {
    renderArchivos();

    expect(screen.getByText(/se guardan como respaldo sin leerse/i)).toBeInTheDocument();
    expect(screen.queryByText(/adjunto/i)).not.toBeInTheDocument();
  });

  it("con un solo archivo el contador dice «1 adjunto», en singular", () => {
    renderArchivos({ files: archivos("uno.pdf") });
    expect(screen.getByText("1 adjunto")).toBeInTheDocument();
  });

  it("lista cada archivo y permite quitarlo por su nombre", async () => {
    const user = userEvent.setup();
    const lista = archivos("pedido.pdf", "precios.xlsx");
    const props = renderArchivos({ files: lista });

    expect(screen.getByText("2 adjuntos")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quitar precios.xlsx" }));

    expect(props.onRemoveFile).toHaveBeenCalledTimes(1);
    expect(props.onRemoveFile).toHaveBeenCalledWith(lista[1]);
  });

  it("al elegir archivos los entrega y limpia el input para poder elegir el mismo otra vez", () => {
    const props = renderArchivos();
    const entrada = document.getElementById("orden-venta-docs-archivos") as HTMLInputElement;
    const elegidos = archivos("pedido.pdf");

    fireEvent.change(entrada, { target: { files: elegidos } });

    expect(props.onFilesSelected).toHaveBeenCalledTimes(1);
    expect(entrada.value).toBe("");
  });

  it("el texto de la zona cambia mientras se arrastra encima", () => {
    renderArchivos({ isDropActive: true });

    expect(screen.getByText("Suelta los archivos aquí")).toBeInTheDocument();
    expect(screen.queryByText("Arrastra o selecciona")).not.toBeInTheDocument();
  });

  it("reenvía los eventos de arrastrar y soltar de la zona", () => {
    const props = renderArchivos();
    const zona = screen.getByText("Arrastra o selecciona").closest("label") as HTMLLabelElement;

    fireEvent.dragOver(zona);
    fireEvent.dragLeave(zona);
    fireEvent.drop(zona);

    expect(props.onDragOver).toHaveBeenCalledTimes(1);
    expect(props.onDragLeave).toHaveBeenCalledTimes(1);
    expect(props.onDrop).toHaveBeenCalledTimes(1);
  });
});
