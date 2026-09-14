import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CapturaOrdenUploadForm } from "./CapturaOrdenUploadForm";

vi.mock("@/lib/images/compress-image-file", () => ({
  compressImageFile: async (file: File) => file,
}));

function galleryInput(): HTMLInputElement {
  return screen.getByLabelText("Elegir de galería") as HTMLInputElement;
}

describe("CapturaOrdenUploadForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("no usa form nativo que iOS reenvía al volver de Fotos", () => {
    const { container } = render(
      <CapturaOrdenUploadForm idOrdenVenta="ov-1" />,
    );
    expect(container.querySelector("form")).toBeNull();
    expect(screen.getByLabelText("Tomar foto")).toBeTruthy();
    expect(galleryInput()).toBeTruthy();
  });

  it("activa Subir y leer hoja al elegir una foto", async () => {
    const user = userEvent.setup();
    const onFilePicked = vi.fn();
    render(
      <CapturaOrdenUploadForm idOrdenVenta="ov-1" onFilePicked={onFilePicked} />,
    );

    const submit = screen.getByRole("button", { name: /subir y leer hoja/i });
    expect(submit).toBeDisabled();

    const file = new File([new Uint8Array([1, 2, 3, 4])], "hoja.jpg", {
      type: "image/jpeg",
    });
    await user.upload(galleryInput(), file);

    expect(onFilePicked).toHaveBeenCalled();
    expect(screen.getByText(/foto seleccionada/i)).toBeInTheDocument();
    expect(submit).not.toBeDisabled();
  });

  it("activa el botón si el input tiene archivo tras change nativo", () => {
    render(<CapturaOrdenUploadForm idOrdenVenta="ov-native" />);
    const input = galleryInput();
    const file = new File([new Uint8Array([9, 8, 7])], "hoja.jpg", {
      type: "image/jpeg",
    });
    Object.defineProperty(input, "files", {
      configurable: true,
      value: {
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
      },
    });
    act(() => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(screen.getByText(/foto seleccionada/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /subir y leer hoja/i }),
    ).not.toBeDisabled();
  });

  it("sube con fetch JSON y no navega la página", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, precisionEstimada: 90 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CapturaOrdenUploadForm idOrdenVenta="ov-1" />);

    const file = new File([new Uint8Array([1, 2, 3, 4])], "hoja.jpg", {
      type: "image/jpeg",
    });
    await user.upload(galleryInput(), file);
    await user.click(screen.getByRole("button", { name: /subir y leer hoja/i }));

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Accept: "application/json" });
    expect(
      await screen.findByText(/el operador ya puede descargar/i),
    ).toBeInTheDocument();
  });
});
