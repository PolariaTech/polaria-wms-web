import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoFotos, FilaFoto } from "./estado-fotos.service";

const leer = vi.hoisted(() => vi.fn());
const cuenta = vi.hoisted(() => ({ codigoCuenta: "023WA" as string | null }));

vi.mock("./estado-fotos.service", () => ({ leerEstadoFotos: leer }));
vi.mock("@/modules/admin-panel/shared/hooks/useAdminMaestroScope", () => ({
  useAdminMaestroScope: () => ({ codigoCuenta: cuenta.codigoCuenta }),
}));
vi.mock("@/components/shared/module/OperationalModuleShell", () => ({
  OperationalModuleShell: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));

import { EstadoFotosPageContent } from "./EstadoFotosPageContent";

const FILA: FilaFoto = {
  idIntento: "i-1",
  idOrdenVenta: "ov-1",
  codigoOv: "OV-00000552",
  idOrdenTrabajo: "1",
  ot: null,
  estado: "fallo",
  colgada: false,
  mensajeError: "La IA no respondió a tiempo.",
  numeroIntento: 2,
  tiempoTotalMs: 9800,
  urlFoto: "https://res.cloudinary.com/x/foto.jpg",
  creadoEn: "2026-11-06T15:15:00.000Z",
};

const RESPUESTA: EstadoFotos = {
  resumen: { recibida: 0, procesando: 0, lista: 5, fallo: 1, colgadas: 0, total: 6 },
  filas: [FILA],
};

describe("EstadoFotosPageContent", () => {
  beforeEach(() => {
    leer.mockReset();
    leer.mockResolvedValue(RESPUESTA);
    cuenta.codigoCuenta = "023WA";
  });

  it("al abrir pide el rango «Hoy» sin filtro de estado y muestra el resumen y la tabla", async () => {
    render(<EstadoFotosPageContent />);

    expect(screen.getByRole("heading", { name: "Estado de fotos" })).toBeInTheDocument();
    expect(await screen.findByText("OV-00000552")).toBeInTheDocument();
    expect(leer).toHaveBeenCalledWith({ codigoCuenta: "023WA", rango: "hoy", estado: null });
    expect(screen.getByRole("button", { name: "Hoy" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Últimos 30 días" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /5\s*Listas/ })).toBeInTheDocument();
    expect(screen.getByText(/La IA no respondió a tiempo\./)).toBeInTheDocument();  });

  it("la tabla se desplaza por dentro y su contenedor es `relative`, para que los textos sr-only no alarguen la página", async () => {
    render(<EstadoFotosPageContent />);
    const tabla = await screen.findByRole("table");

    const contenedor = tabla.closest("[aria-busy]");
    expect(contenedor).toHaveClass("overflow-auto", "relative", "flex-1");
  });

  it("al cambiar el rango vuelve a consultar con ese rango", async () => {
    render(<EstadoFotosPageContent />);
    await screen.findByText("OV-00000552");

    await userEvent.click(screen.getByRole("button", { name: "Ayer" }));

    await waitFor(() =>
      expect(leer).toHaveBeenLastCalledWith({ codigoCuenta: "023WA", rango: "ayer", estado: null }),
    );
    expect(screen.getByRole("button", { name: "Ayer" })).toHaveAttribute("aria-pressed", "true");
  });

  it("«Últimos 30 días» es una opción más, junto a «Últimos 7 días», y consulta ese rango", async () => {
    render(<EstadoFotosPageContent />);
    await screen.findByText("OV-00000552");

    const rangos = screen.getByRole("group", { name: "Rango de fechas" });
    expect(
      within(rangos)
        .getAllByRole("button")
        .map((boton) => boton.textContent),
    ).toEqual(["Hoy", "Ayer", "Últimos 7 días", "Últimos 30 días"]);

    await userEvent.click(screen.getByRole("button", { name: "Últimos 30 días" }));

    await waitFor(() =>
      expect(leer).toHaveBeenLastCalledWith({
        codigoCuenta: "023WA",
        rango: "30dias",
        estado: null,
      }),
    );
  });

  it("sin cuenta activa no consulta y lo explica", () => {
    cuenta.codigoCuenta = null;
    render(<EstadoFotosPageContent />);

    expect(leer).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("No hay una cuenta activa.");
  });

  it("al pulsar un estado del resumen filtra la tabla por ese estado", async () => {
    render(<EstadoFotosPageContent />);
    await screen.findByText("OV-00000552");

    await userEvent.click(screen.getByRole("button", { name: /Con fallo/ }));

    await waitFor(() =>
      expect(leer).toHaveBeenLastCalledWith({
        codigoCuenta: "023WA",
        rango: "hoy",
        estado: "fallo",
      }),
    );
  });

  it("«Todas» vuelve a mostrar todos los estados después de filtrar", async () => {
    render(<EstadoFotosPageContent />);
    await screen.findByText("OV-00000552");
    await userEvent.click(screen.getByRole("button", { name: /Con fallo/ }));
    await waitFor(() =>
      expect(leer).toHaveBeenLastCalledWith(expect.objectContaining({ estado: "fallo" })),
    );

    await userEvent.click(screen.getByRole("button", { name: /Todas/ }));

    await waitFor(() =>
      expect(leer).toHaveBeenLastCalledWith({ codigoCuenta: "023WA", rango: "hoy", estado: null }),
    );
  });

  it("con un estado elegido y sin filas, el mensaje nombra el filtro y dice cómo quitarlo", async () => {
    render(<EstadoFotosPageContent />);
    await screen.findByText("OV-00000552");
    leer.mockResolvedValue({
      resumen: { recibida: 0, procesando: 0, lista: 5, fallo: 0, colgadas: 0, total: 5 },
      filas: [],
    });

    await userEvent.click(screen.getByRole("button", { name: /Con fallo/ }));

    expect(
      await screen.findByText(
        "No hay fotos «Con fallo» en este rango. Pulsa «Todas» para quitar el filtro.",
      ),
    ).toBeInTheDocument();
  });

  it("anuncia a un lector de pantalla cuántas filas quedaron", async () => {
    const { container } = render(<EstadoFotosPageContent />);
    await screen.findByText("OV-00000552");

    const anuncio = container.querySelector("[aria-live='polite']");
    expect(anuncio).toHaveClass("sr-only");
    expect(anuncio).toHaveTextContent("1 foto en la tabla.");
  });

  it("sin fotos explica que no llegó ninguna", async () => {
    leer.mockResolvedValue({
      resumen: { recibida: 0, procesando: 0, lista: 0, fallo: 0, colgadas: 0, total: 0 },
      filas: [],
    });
    render(<EstadoFotosPageContent />);

    expect(await screen.findByText("Todavía no llegaron fotos en este rango.")).toBeInTheDocument();
  });

  it("si la consulta falla muestra el error y deja reintentar", async () => {
    leer.mockRejectedValueOnce(new Error("boom"));
    render(<EstadoFotosPageContent />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar las fotos.");

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("OV-00000552")).toBeInTheDocument();
    expect(leer).toHaveBeenCalledTimes(2);
  });

  it("avisa cuando hay más fotos que las 50 que se muestran", async () => {
    leer.mockResolvedValue({ ...RESPUESTA, resumen: { ...RESPUESTA.resumen, total: 120 } });
    render(<EstadoFotosPageContent />);

    expect(await screen.findByText(/Se muestran las 50 más recientes de 120/)).toBeInTheDocument();
  });
});
