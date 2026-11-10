import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DespachoPublicoLista } from "./DespachoPublicoLista";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const alistada = [
  {
    idOrdenVenta: "ov-1",
    codigo: "OV-1",
    estado: "alistada" as const,
    codigoCuenta: "023WA",
    nombreCliente: "Krystal Cancún",
  },
];
const alistamiento = [
  {
    idOrdenVenta: "ov-2",
    codigo: "OV-2",
    estado: "alistamiento" as const,
    codigoCuenta: "023WA",
    nombreCliente: "Hive",
  },
];

describe("DespachoPublicoLista", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("muestra alistada y deja alistamiento en el acordeón", () => {
    render(
      <DespachoPublicoLista
        alistada={alistada}
        alistamiento={alistamiento}
        errorCarga={null}
      />,
    );

    expect(screen.getByRole("button", { name: /OV-1/ })).toBeInTheDocument();
    expect(screen.getByText(/Krystal Cancún/)).toBeInTheDocument();
    expect(screen.queryByText(/023WA/)).not.toBeInTheDocument();
    expect(screen.getByText("alistamiento (1)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /OV-2/ })).toBeInTheDocument();
  });

  it("no confirma hasta tener los dos nombres", async () => {
    render(
      <DespachoPublicoLista
        alistada={alistada}
        alistamiento={[]}
        errorCarga={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /OV-1/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Krystal Cancún");
    const confirmar = screen.getByRole("button", { name: "Pasar a despachada" });

    fireEvent.click(confirmar);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Escribe quién despachó la mercancía.",
    );

    fireEvent.change(screen.getByLabelText("Quién despachó la mercancía"), {
      target: { value: "Ana" },
    });
    fireEvent.click(confirmar);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Escribe quién es el transportista.",
    );

    fireEvent.change(screen.getByLabelText("Quién despachó la mercancía"), {
      target: { value: "a".repeat(121) },
    });
    fireEvent.change(screen.getByLabelText("Transportista"), {
      target: { value: "Luis" },
    });
    fireEvent.click(confirmar);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "El nombre de quien despachó es demasiado largo.",
    );

    fireEvent.change(screen.getByLabelText("Quién despachó la mercancía"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Transportista"), {
      target: { value: "b".repeat(121) },
    });
    fireEvent.click(confirmar);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "El nombre del transportista es demasiado largo.",
    );

    fireEvent.change(screen.getByLabelText("Transportista"), {
      target: { value: "Luis" },
    });

    fireEvent.click(confirmar);

    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "¿Seguro que quieres despachar OV-1 de Krystal Cancún?",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByLabelText("Quién despachó la mercancía")).toHaveValue("Ana");
    expect(screen.queryByRole("button", { name: "Sí, despachar" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pasar a despachada" }));

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Sí, despachar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/despacho/api",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("no cierra el modal al pulsar fuera", () => {
    render(
      <DespachoPublicoLista
        alistada={alistada}
        alistamiento={[]}
        errorCarga={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /OV-1/ }));
    const dialogo = screen.getByRole("dialog");
    fireEvent.click(dialogo.parentElement as HTMLElement);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Quién despachó la mercancía")).toBeInTheDocument();
  });
});
