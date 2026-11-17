import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cliente = vi.hoisted(() => ({
  obtenerCorreoCompleto: vi.fn(),
  descargarAdjunto: vi.fn(),
}));
const navegacion = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock("../services/correos.client", () => cliente);
vi.mock("next/navigation", () => ({ useRouter: () => navegacion }));
vi.mock("../services/correo-fila.client", () => ({
  obtenerFilaCorreo: vi.fn(() => new Promise(() => {})),
}));
vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  usePolariaToast: () => ({ showToast: vi.fn() }),
}));

import { usuario } from "../testing/correos.fixtures";
import type { CorreoContenido } from "../types/correos.types";
import { CorreoCompletoVista } from "./CorreoCompletoVista";

const ID = "msg-2";
const correo: CorreoContenido = {
  asunto: "Pedido XEL",
  de: "ana@x.example",
  para: "ventas@x.example",
  fecha: "2026-11-03T13:27:51.000Z",
  texto: "Hola",
  html: "<p>Hola</p>",
  adjuntos: [],
};

async function abrir(messageId = ID) {
  cliente.obtenerCorreoCompleto.mockResolvedValue(correo);
  render(<CorreoCompletoVista messageId={messageId} />);
  await screen.findByTitle("Cuerpo del correo");
}

describe("CorreoCompletoVista — recorrido (REQ-317)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("sin ids en sessionStorage no muestra Anterior ni Siguiente", async () => {
    await abrir();
    expect(screen.queryByRole("button", { name: "Correo anterior" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Correo siguiente" })).not.toBeInTheDocument();
  });

  it("recorre el bloque con replace y muestra la posición", async () => {
    sessionStorage.setItem(
      "polaria.ventas.correos.recorrido",
      JSON.stringify({ modo: "descartados", ids: ["msg-1", "msg-2", "msg-3"] }),
    );
    await abrir();

    expect(screen.getByText("2 de 3")).toBeInTheDocument();
    const user = usuario();
    await user.click(screen.getByRole("button", { name: "Correo siguiente" }));
    expect(navegacion.replace).toHaveBeenCalledWith("/dashboard/ventas/correo/msg-3");
    expect(navegacion.push).not.toHaveBeenCalled();
  });

  it("en el primer correo deshabilita Anterior y muestra la posición", async () => {
    sessionStorage.setItem(
      "polaria.ventas.correos.recorrido",
      JSON.stringify({ modo: "descartados", ids: ["msg-2", "msg-3"] }),
    );
    await abrir();

    expect(screen.getByRole("button", { name: "Correo anterior" })).toBeDisabled();
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
    expect(screen.queryByText("No hay más correos en esta lista")).not.toBeInTheDocument();
  });
});
