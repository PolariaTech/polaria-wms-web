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

function stubFetchOk() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, precisionEstimada: 90 }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("CapturaOrdenUploadForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("no usa form nativo ni capture (iOS abriría cámara sin marco)", () => {
    const { container } = render(
      <CapturaOrdenUploadForm idOrdenVenta="ov-1" />,
    );
    expect(container.querySelector("form")).toBeNull();
    expect(screen.getByLabelText("Tomar foto")).toBeTruthy();
    expect(screen.getByLabelText("Elegir de galería")).toBeTruthy();
    expect(galleryInput().getAttribute("capture")).toBeNull();
  });

  it("sube al elegir una foto de galería", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetchOk();
    const onFilePicked = vi.fn();
    const onUploadOk = vi.fn();
    render(
      <CapturaOrdenUploadForm
        idOrdenVenta="ov-1"
        onFilePicked={onFilePicked}
        onUploadOk={onUploadOk}
      />,
    );

    const file = new File([new Uint8Array([1, 2, 3, 4])], "hoja.jpg", {
      type: "image/jpeg",
    });
    await user.upload(galleryInput(), file);

    expect(onFilePicked).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalled();
    await vi.waitFor(() => expect(onUploadOk).toHaveBeenCalled());
    expect(screen.queryByText(/90%|muy baja|tomar otra foto/i)).toBeNull();
  });

  it("sube si el input tiene archivo tras change nativo", async () => {
    const fetchMock = stubFetchOk();
    const onUploadOk = vi.fn();
    render(
      <CapturaOrdenUploadForm
        idOrdenVenta="ov-native"
        onUploadOk={onUploadOk}
      />,
    );
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

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await vi.waitFor(() => expect(onUploadOk).toHaveBeenCalled());
  });

  it("sube con fetch JSON y no navega la página", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetchOk();
    const onUploadOk = vi.fn();

    render(
      <CapturaOrdenUploadForm idOrdenVenta="ov-1" onUploadOk={onUploadOk} />,
    );

    const file = new File([new Uint8Array([1, 2, 3, 4])], "hoja.jpg", {
      type: "image/jpeg",
    });
    await user.upload(galleryInput(), file);

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Accept: "application/json" });
    await vi.waitFor(() => expect(onUploadOk).toHaveBeenCalled());
  });

  it("pide getUserMedia al tocar Tomar foto (cámara con marco)", async () => {
    const user = userEvent.setup();
    const track = { stop: vi.fn() };
    const stream = {
      getTracks: () => [track],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: { getUserMedia },
    });
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });

    render(<CapturaOrdenUploadForm idOrdenVenta="ov-1" />);
    await user.click(screen.getByLabelText("Tomar foto"));

    await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    expect(getUserMedia.mock.calls[0]?.[0]).toMatchObject({
      audio: false,
      video: expect.objectContaining({
        facingMode: expect.anything(),
      }),
    });
    expect(screen.getByLabelText("Capturar hoja")).toBeTruthy();
    expect(screen.getByText(/encaja la hoja dentro del marco/i)).toBeTruthy();
  });

  it("explica HTTPS si el contexto no es seguro (http://IP en iPhone)", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: undefined,
    });

    render(<CapturaOrdenUploadForm idOrdenVenta="ov-1" />);
    await vi.waitFor(() =>
      expect(screen.getByText(/http local/i)).toBeTruthy(),
    );
    await user.click(screen.getByLabelText("Tomar foto"));
    expect(
      screen.getByText(/cámara con marco solo funciona en https/i),
    ).toBeTruthy();
  });

  it("avisa al padre si el servidor responde error", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error:
          "Mateo no pudo analizar la foto ahora. Espera un momento e intenta de nuevo.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onUploadError = vi.fn();

    render(
      <CapturaOrdenUploadForm
        idOrdenVenta="ov-1"
        onUploadError={onUploadError}
      />,
    );

    const file = new File([new Uint8Array([1, 2, 3, 4])], "hoja.jpg", {
      type: "image/jpeg",
    });
    await user.upload(galleryInput(), file);

    await vi.waitFor(() =>
      expect(onUploadError).toHaveBeenCalledWith(
        expect.stringMatching(/mateo no pudo analizar/i),
      ),
    );
  });

  it("muestra el mensaje claro cuando la foto está mal tomada (422)", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error:
          "La foto fue tomada mal. Intenta de nuevo: encaja la hoja completa dentro del marco y asegúrate de que se vea clara (incluida la hora impresa).",
        codigo: "foto_mala",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onUploadError = vi.fn();

    render(
      <CapturaOrdenUploadForm
        idOrdenVenta="ov-1"
        onUploadError={onUploadError}
      />,
    );

    const file = new File([new Uint8Array([1, 2, 3, 4])], "hoja.jpg", {
      type: "image/jpeg",
    });
    await user.upload(galleryInput(), file);

    await vi.waitFor(() =>
      expect(onUploadError).toHaveBeenCalledWith(
        expect.stringMatching(/foto fue tomada mal/i),
      ),
    );
  });
});
