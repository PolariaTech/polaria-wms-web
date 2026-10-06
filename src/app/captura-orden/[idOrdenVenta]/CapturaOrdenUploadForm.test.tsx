import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CapturaOrdenUploadForm } from "./CapturaOrdenUploadForm";

vi.mock("@/lib/images/compress-image-file", () => ({
  compressImageFile: async (file: File) => file,
}));

function cameraInput(): HTMLInputElement {
  return screen.getByLabelText("Tomar foto") as HTMLInputElement;
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

  it("no usa form nativo que iOS reenvía al volver de Fotos", () => {
    const { container } = render(
      <CapturaOrdenUploadForm idOrdenVenta="ov-1" />,
    );
    expect(container.querySelector("form")).toBeNull();
    expect(screen.getByLabelText("Tomar foto")).toBeTruthy();
    expect(screen.queryByLabelText("Elegir de galería")).toBeNull();
  });

  it("sube al tomar una foto", async () => {
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
    await user.upload(cameraInput(), file);

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
    const input = cameraInput();
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
    await user.upload(cameraInput(), file);

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Accept: "application/json" });
    await vi.waitFor(() => expect(onUploadOk).toHaveBeenCalled());
  });
});
