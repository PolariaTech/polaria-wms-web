import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DespachoPublicoPage from "./page";

const listar = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/modules/sales/ordenes/despacho/despacho-publico.service", () => ({
  listarOrdenesDespachoPublico: listar,
}));

describe("DespachoPublicoPage", () => {
  beforeEach(() => {
    listar.mockReset();
  });

  it("separa alistada arriba y alistamiento en el acordeón", async () => {
    listar.mockResolvedValue([
      {
        idOrdenVenta: "ov-2",
        codigo: "OV-2",
        estado: "alistamiento",
        codigoCuenta: "023WA",
        nombreCliente: "Hive",
      },
      {
        idOrdenVenta: "ov-1",
        codigo: "OV-1",
        estado: "alistada",
        codigoCuenta: "023WA",
        nombreCliente: "Krystal Cancún",
      },
    ]);

    render(
      await DespachoPublicoPage({
        searchParams: Promise.resolve({ cuenta: "023WA" }),
      }),
    );

    expect(listar).toHaveBeenCalledWith("023WA");
    expect(screen.getByRole("button", { name: /OV-1/ })).toBeInTheDocument();
    expect(screen.getByText("alistamiento (1)")).toBeInTheDocument();
  });

  it("sin la cuenta del QR no lista órdenes", async () => {
    render(await DespachoPublicoPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Escanea el código de despacho.")).toBeInTheDocument();
    expect(listar).not.toHaveBeenCalled();
  });

  it("avisa si el listado no carga", async () => {
    listar.mockRejectedValue(new Error("No se pudo cargar el listado."));

    render(
      await DespachoPublicoPage({
        searchParams: Promise.resolve({ cuenta: "023WA" }),
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo cargar el listado.",
    );
  });
});
