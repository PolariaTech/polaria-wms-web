import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CapturaOrdenUploadForm } from "./CapturaOrdenUploadForm";

// REQ-247: el servidor recibe la foto (202) y la lee en segundo plano.
vi.mock("@/lib/images/compress-image-file", () => ({
  compressImageFile: async (file: File) => file,
}));

function galleryInput(): HTMLInputElement {
  return screen.getByLabelText("Elegir de galería") as HTMLInputElement;
}

function subirFoto(nombre: string): File {
  return new File([new Uint8Array([1, 2, 3, 4])], nombre, { type: "image/jpeg" });
}

describe("CapturaOrdenUploadForm — cola en segundo plano", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("con el servidor nuevo (202) avisa «recibida» con el id del intento y deja tomar otra foto", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ ok: true, estado: "recibida", idIntento: "id-77" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onReceived = vi.fn();
    const onUploadOk = vi.fn();
    render(
      <CapturaOrdenUploadForm idOrdenVenta="ov-1" onReceived={onReceived} onUploadOk={onUploadOk} />,
    );

    await user.upload(galleryInput(), subirFoto("hoja-5.jpg"));

    await vi.waitFor(() => expect(onReceived).toHaveBeenCalledWith("id-77"));
    expect(onUploadOk).not.toHaveBeenCalled();
    expect(await screen.findByLabelText("Nueva foto")).toBeTruthy();
  });

  it("puede tomar otra foto en cuanto la anterior queda recibida, sin esperar a que se procese", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({ ok: true, idIntento: "id-1" }) })
      .mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({ ok: true, idIntento: "id-2" }) });
    vi.stubGlobal("fetch", fetchMock);
    const onReceived = vi.fn();
    render(<CapturaOrdenUploadForm idOrdenVenta="ov-1" onReceived={onReceived} />);

    await user.upload(galleryInput(), subirFoto("primera.jpg"));
    await vi.waitFor(() => expect(onReceived).toHaveBeenCalledWith("id-1"));
    await user.upload(galleryInput(), subirFoto("segunda.jpg"));
    await vi.waitFor(() => expect(onReceived).toHaveBeenCalledWith("id-2"));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("si el servidor ya tiene la foto y falló, «Reintentar» pide reprocesarla sin reenviarla", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ ok: true, idIntento: "id-9", numeroIntento: 2 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onReceived = vi.fn();
    render(
      <CapturaOrdenUploadForm
        idOrdenVenta="ov-1"
        idOrdenTrabajo="pedido:1|almacen:a"
        idIntentoReintento="id-9"
        onReceived={onReceived}
      />,
    );

    await user.click(screen.getByLabelText("Reintentar"));

    await vi.waitFor(() => expect(onReceived).toHaveBeenCalledWith("id-9"));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("reintentar=id-9");
    expect(url).toContain("ot=pedido%3A1%7Calmacen%3Aa");
    expect(init.body).toBeUndefined(); // no se vuelve a subir la foto
  });

  it("si el reintento en el servidor no es posible muestra el motivo", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "La foto no se guardó. Tómala de nuevo.", codigo: "sin_foto" }),
      }),
    );
    const onUploadError = vi.fn();
    render(
      <CapturaOrdenUploadForm idOrdenVenta="ov-1" idIntentoReintento="id-9" onUploadError={onUploadError} />,
    );

    await user.click(screen.getByLabelText("Reintentar"));

    await vi.waitFor(() =>
      expect(onUploadError).toHaveBeenCalledWith("La foto no se guardó. Tómala de nuevo."),
    );
  });
});
