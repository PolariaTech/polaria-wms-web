import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cliente = vi.hoisted(() => ({
  obtenerCorreoCompleto: vi.fn(),
  descargarAdjunto: vi.fn(),
}));
vi.mock("../services/correos.client", () => cliente);

const navegacion = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegacion }));

import { usuario } from "../testing/correos.fixtures";
import type { CorreoContenido } from "../types/correos.types";
import { CorreoCompletoVista } from "./CorreoCompletoVista";

const ID = "1a1a198510cde156";

const correo = (parcial: Partial<CorreoContenido> = {}): CorreoContenido => ({
  asunto: "Pedido XEL",
  de: '"Ana Torres" <ana@x.example>',
  para: "ventas@x.example",
  fecha: "2026-11-03T13:27:51.000Z",
  texto: "Hola",
  html: "<p>Hola <b>mundo</b></p>",
  adjuntos: [
    { indice: 0, nombre: "pedido.pdf", mimeType: "application/pdf", tamano: 48213 },
    { indice: 1, nombre: "detalle.xlsx", mimeType: "application/vnd.ms-excel", tamano: 2_500_000 },
  ],
  ...parcial,
});

async function abrir(parcial: Partial<CorreoContenido> = {}) {
  cliente.obtenerCorreoCompleto.mockResolvedValue(correo(parcial));
  render(<CorreoCompletoVista messageId={ID} />);
  await screen.findByRole("heading", { name: parcial.asunto ?? "Pedido XEL" });
}

const marco = () => screen.getByTitle("Cuerpo del correo");

describe("CorreoCompletoVista — el correo (REQ-104)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it("muestra quién lo mandó, la fecha en hora de Colombia y los adjuntos con su tamaño", async () => {
    await abrir();

    expect(cliente.obtenerCorreoCompleto).toHaveBeenCalledWith(ID, expect.any(AbortSignal));
    expect(screen.getByText("Ana Torres")).toBeInTheDocument();
    expect(screen.getByText("ana@x.example")).toBeInTheDocument();
    expect(screen.getByText(/3 de noviembre de 2026/)).toBeInTheDocument();
    expect(screen.getByText("2 adjuntos")).toBeInTheDocument();
    expect(screen.getByText("47,1 KB")).toBeInTheDocument();
    expect(screen.getByText("2,4 MB")).toBeInTheDocument();
  });

  it("mientras lee en Gmail avisa que está abriendo el correo", () => {
    cliente.obtenerCorreoCompleto.mockReturnValue(new Promise(() => undefined));
    render(<CorreoCompletoVista messageId={ID} />);
    expect(screen.getByText("Abriendo el correo…")).toBeInTheDocument();
  });

  it("mantiene a Polo hasta que el mensaje termina de dibujar, y entonces muestra todo junto", async () => {
    await abrir();
    const articulo = screen.getByRole("article");

    if (articulo.getAttribute("aria-busy") === "true") {
      expect(screen.getByText("Abriendo el correo…")).toBeInTheDocument();
      fireEvent.load(marco());
    }

    await waitFor(() => expect(screen.queryByText("Abriendo el correo…")).not.toBeInTheDocument());
    expect(articulo).toHaveAttribute("aria-busy", "false");
  });

  it("si el marco nunca avisa que cargó, muestra el correo pasado el plazo", async () => {
    await abrir();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Abriendo el correo…")).not.toBeInTheDocument();
  });

  it("«Volver a los correos» regresa a la lista de donde se vino", async () => {
    const usr = usuario();
    vi.spyOn(window.history, "length", "get").mockReturnValue(3);
    await abrir();

    await usr.click(screen.getByRole("button", { name: "Volver a los correos" }));

    expect(navegacion.back).toHaveBeenCalledTimes(1);
    expect(navegacion.push).not.toHaveBeenCalled();
  });

  it("si la pantalla se abrió directo, «Volver» lleva a los correos descartados", async () => {
    const usr = usuario();
    vi.spyOn(window.history, "length", "get").mockReturnValue(1);
    await abrir();

    await usr.click(screen.getByRole("button", { name: "Volver a los correos" }));

    expect(navegacion.push).toHaveBeenCalledWith("/dashboard/ventas/correos-descartados");
    expect(navegacion.back).not.toHaveBeenCalled();
  });

  it("si falla la lectura muestra el motivo y deja reintentar", async () => {
    const usr = usuario();
    cliente.obtenerCorreoCompleto.mockRejectedValueOnce(new Error("n8n no respondió."));
    render(<CorreoCompletoVista messageId={ID} />);

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("n8n no respondió.");

    cliente.obtenerCorreoCompleto.mockResolvedValue(correo());
    await usr.click(within(alerta).getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: "Pedido XEL" })).toBeInTheDocument();
    expect(cliente.obtenerCorreoCompleto).toHaveBeenCalledTimes(2);
  });

  it("un correo sin adjuntos no muestra esa sección", async () => {
    await abrir({ adjuntos: [] });
    expect(screen.queryByText(/adjunto/i)).not.toBeInTheDocument();
  });

  it("un solo adjunto se anuncia en singular", async () => {
    await abrir({
      adjuntos: [{ indice: 0, nombre: "a.pdf", mimeType: "application/pdf", tamano: 10 }],
    });
    expect(screen.getByText("1 adjunto")).toBeInTheDocument();
  });

  it("sin asunto ni remitente no se rompe", async () => {
    cliente.obtenerCorreoCompleto.mockResolvedValue(
      correo({ asunto: "", de: "", para: "", fecha: null }),
    );
    render(<CorreoCompletoVista messageId={ID} />);
    expect(await screen.findByRole("heading", { name: "Correo sin asunto" })).toBeInTheDocument();
  });

  it("muestra el mensaje en texto cuando el correo no trae HTML", async () => {
    await abrir({ html: "", texto: "Solo texto <b>plano</b>" });
    const documento = marco().getAttribute("srcdoc") ?? "";
    expect(documento).toContain("<pre>Solo texto &lt;b&gt;plano&lt;/b&gt;</pre>");
  });
});

describe("CorreoCompletoVista — aislamiento del mensaje (REQ-104)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it("el marco no puede ejecutar scripts ni tocar esta página", async () => {
    await abrir();
    const permisos = (marco().getAttribute("sandbox") ?? "").split(" ").sort();
    expect(permisos).toEqual(["allow-popups", "allow-popups-to-escape-sandbox"]);
    expect(marco()).toHaveAttribute("referrerpolicy", "no-referrer");
  });

  it("quita scripts y eventos del HTML y deja la política de contenido", async () => {
    await abrir({
      html: '<p onclick="robar()">Hola</p><script>robar()</script><form action="x"></form>',
    });
    const documento = marco().getAttribute("srcdoc") ?? "";
    expect(documento).toContain("Content-Security-Policy");
    expect(documento).toContain("default-src 'none'");
    expect(documento).not.toContain("robar()");
    expect(documento).not.toContain("<form");
  });

  it("bloquea las imágenes de internet hasta que se pidan", async () => {
    const usr = usuario();
    await abrir({ html: '<img src="https://rastreo.example/p.png">' });

    expect(marco().getAttribute("srcdoc")).toContain("img-src data: blob:;");
    expect(marco().getAttribute("srcdoc")).not.toContain("https:;");
    await usr.click(screen.getByRole("button", { name: "Mostrar imágenes" }));

    expect(marco().getAttribute("srcdoc")).toContain("img-src data: blob: https:;");
    expect(screen.queryByRole("button", { name: "Mostrar imágenes" })).not.toBeInTheDocument();
  });

  it("no ofrece mostrar imágenes si el correo no trae ninguna de internet", async () => {
    await abrir({ html: '<p>Hola</p><img src="data:image/png;base64,AAAA">' });
    expect(screen.queryByRole("button", { name: "Mostrar imágenes" })).not.toBeInTheDocument();
  });
});

describe("CorreoCompletoVista — adjuntos (REQ-104)", () => {
  const pestana = { location: { href: "" }, close: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    pestana.location.href = "";
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn(() => "blob:adjunto"),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    vi.spyOn(window, "open").mockReturnValue(pestana as unknown as Window);
    cliente.descargarAdjunto.mockResolvedValue(new Blob(["contenido"]));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("descarga el archivo con la sesión y lo guarda con su nombre", async () => {
    const usr = usuario();
    await abrir();

    await usr.click(screen.getByRole("button", { name: "Descargar pedido.pdf" }));

    await waitFor(() => expect(cliente.descargarAdjunto).toHaveBeenCalledWith(ID, 0));
    await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("«Ver» abre la pestaña en el mismo clic y la lleva al archivo", async () => {
    const usr = usuario();
    await abrir();

    await usr.click(screen.getByRole("button", { name: "Ver pedido.pdf" }));

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    await waitFor(() => expect(pestana.location.href).toBe("blob:adjunto"));
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it("si el navegador bloquea la pestaña, lo descarga en lugar de perderlo", async () => {
    const usr = usuario();
    vi.spyOn(window, "open").mockReturnValue(null);
    await abrir();

    await usr.click(screen.getByRole("button", { name: "Ver pedido.pdf" }));

    await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1));
  });

  it("solo ofrece «Ver» para PDF e imágenes seguras, nunca para una hoja de cálculo", async () => {
    await abrir();
    expect(screen.getByRole("button", { name: "Ver pedido.pdf" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver detalle.xlsx" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar detalle.xlsx" })).toBeInTheDocument();
  });

  it("si falla la descarga muestra el motivo y cierra la pestaña que abrió", async () => {
    const usr = usuario();
    cliente.descargarAdjunto.mockRejectedValue(new Error("El correo no tiene ese adjunto."));
    await abrir();

    await usr.click(screen.getByRole("button", { name: "Ver pedido.pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El correo no tiene ese adjunto.");
    expect(pestana.close).toHaveBeenCalledTimes(1);
  });

  it("mientras baja un archivo, su botón queda deshabilitado", async () => {
    const usr = usuario();
    cliente.descargarAdjunto.mockReturnValue(new Promise(() => undefined));
    await abrir();

    await usr.click(screen.getByRole("button", { name: "Descargar pedido.pdf" }));

    expect(screen.getByRole("button", { name: "Descargar pedido.pdf" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Descargar detalle.xlsx" })).toBeEnabled();
  });
});
