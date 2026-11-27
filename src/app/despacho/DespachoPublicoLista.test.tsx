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
    denominacionComercial: "Krystal",
    cantidadOrdenesTrabajo: 2,
    ordenCompraCliente: "OC-77",
  },
];
const alistamiento = [
  {
    idOrdenVenta: "ov-2",
    codigo: "OV-2",
    estado: "alistamiento" as const,
    codigoCuenta: "023WA",
    nombreCliente: "Hive",
    denominacionComercial: "Hive",
    cantidadOrdenesTrabajo: 1,
    ordenCompraCliente: "—",
  },
];

function entrar(nombre = "Ana") {
  fireEvent.change(screen.getByLabelText("Quién despachó la mercancía"), {
    target: { value: nombre },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

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

    entrar();
    expect(screen.getByRole("button", { name: /OV-1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /OV-1/ })).toHaveTextContent("Krystal · 2 OT · OC OC-77");
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

    entrar();
    fireEvent.click(screen.getByRole("button", { name: /OV-1/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Krystal Cancún");
    const confirmar = screen.getByRole("button", { name: "Pasar a despachada" });

    fireEvent.change(screen.getByLabelText("Quién despachó la mercancía"), {
      target: { value: "" },
    });
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

    const limite = "a".repeat(120);
    fireEvent.change(screen.getByLabelText("Quién despachó la mercancía"), {
      target: { value: limite },
    });
    fireEvent.change(screen.getByLabelText("Transportista"), {
      target: { value: limite },
    });
    fireEvent.click(confirmar);
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Dejar el anterior" }));
    expect(screen.getByText(`Quién despacha: ${limite}`)).toBeInTheDocument();
    expect(screen.getByText(`Transportista: ${limite}`)).toBeInTheDocument();
    expect(
      screen.getByText(
        "¿Seguro que quieres despachar OV-1 de Krystal Cancún?",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));

    fireEvent.change(screen.getByLabelText("Quién despachó la mercancía"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Transportista"), {
      target: { value: "Luis" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Pasar a despachada" }));

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Quién despacha: Ana")).toBeInTheDocument();
    expect(screen.getByText("Transportista: Luis")).toBeInTheDocument();
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

    entrar();
    fireEvent.click(screen.getByRole("button", { name: /OV-1/ }));
    const dialogo = screen.getByRole("dialog");
    fireEvent.click(dialogo.parentElement as HTMLElement);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Quién despachó la mercancía")).toBeInTheDocument();
  });

  it("tabula primero quien despachó y después el transportista", () => {
    render(
      <DespachoPublicoLista
        alistada={alistada}
        alistamiento={[]}
        errorCarga={null}
      />,
    );

    entrar();
    fireEvent.click(screen.getByRole("button", { name: /OV-1/ }));
    const dialogo = screen.getByRole("dialog");
    const campos = dialogo.querySelectorAll("input");

    expect(campos).toHaveLength(2);
    expect(campos[0]).toHaveAccessibleName("Quién despachó la mercancía");
    expect(campos[1]).toHaveAccessibleName("Transportista");
    expect(campos[0]).not.toHaveAttribute("disabled");
    expect(campos[1]).not.toHaveAttribute("disabled");
    expect(campos[0]).not.toHaveAttribute("autofocus");
  });

  it("repite el nombre nuevo en la siguiente orden si así se elige", () => {
    render(
      <DespachoPublicoLista
        alistada={alistada}
        alistamiento={alistamiento}
        errorCarga={null}
      />,
    );

    entrar("Ana");
    fireEvent.click(screen.getByRole("button", { name: /OV-1/ }));
    fireEvent.change(screen.getByLabelText("Quién despachó la mercancía"), {
      target: { value: "Mario" },
    });
    fireEvent.change(screen.getByLabelText("Transportista"), {
      target: { value: "Luis" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Pasar a despachada" }));
    fireEvent.click(screen.getByRole("button", { name: "Usar este nombre en las siguientes" }));
    expect(screen.getByText("Quién despacha: Mario")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.click(screen.getByRole("button", { name: /OV-2/ }));
    expect(screen.getByLabelText("Quién despachó la mercancía")).toHaveValue("Mario");
  });
});
