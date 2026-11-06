import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EstadoFotosTabla } from "./EstadoFotosTabla";
import type { FilaFoto } from "./estado-fotos.service";

function fila(parcial: Partial<FilaFoto>): FilaFoto {
  return {
    idIntento: "i-1",
    idOrdenVenta: "ov-1",
    codigoOv: "OV-00000552",
    idOrdenTrabajo: "pedido:4501056534|almacen:blue ayb rest veracruz",
    ot: null,
    estado: "lista",
    colgada: false,
    mensajeError: null,
    numeroIntento: 1,
    tiempoTotalMs: 4200,
    urlFoto: "https://res.cloudinary.com/x/foto.jpg",
    creadoEn: "2026-11-06T15:15:00.000Z",
    ...parcial,
  };
}

describe("EstadoFotosTabla", () => {
  it("muestra por intento la OV, la OT, el tiempo y el enlace a la foto, sin el modelo de IA", () => {
    render(<EstadoFotosTabla filas={[fila({})]} />);

    expect(screen.queryByRole("columnheader", { name: "Modelo" })).not.toBeInTheDocument();
    const fila1 = screen.getAllByRole("row")[1];
    expect(within(fila1).getByText("OV-00000552")).toBeInTheDocument();
    expect(within(fila1).getByText("4,2 s")).toBeInTheDocument();
    expect(within(fila1).getByText("Lista")).toBeInTheDocument();
    const enlace = within(fila1).getByRole("link", { name: /Ver foto/ });
    expect(enlace).toHaveAttribute("href", "https://res.cloudinary.com/x/foto.jpg");
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace).toHaveAttribute("rel", "noopener noreferrer");
    // 36 px de alto como mínimo, no los 32 que daba solo el relleno.
    expect(enlace).toHaveClass("min-h-9");
  });

  it("tiene una columna «OT» con la posición y otra «Centro de consumo» con el nombre, no la clave interna", () => {
    render(<EstadoFotosTabla filas={[fila({})]} />);

    expect(screen.getByRole("columnheader", { name: /^OT/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Centro de consumo" })).toBeInTheDocument();
    const fila1 = screen.getAllByRole("row")[1];
    expect(within(fila1).getByText("Blue Ayb Rest Veracruz")).toBeInTheDocument();
    expect(within(fila1).queryByText(/pedido:|almacen:/)).not.toBeInTheDocument();
  });

  it("la posición («2/9») va en su propia columna y el centro de consumo en la siguiente, con el nombre del pedido", () => {
    render(
      <EstadoFotosTabla
        filas={[
          fila({
            ot: {
              numero: 2,
              total: 9,
              almacen: "BLUE Ayb Rest Veracruz",
              pedido: "4501056534",
              pedidoVaria: false,
            },
          }),
        ]}
      />,
    );

    const celdas = within(screen.getAllByRole("row")[1]).getAllByRole("cell");
    // Orden de venta | OT | Centro de consumo | Estado …
    expect(celdas[1]).toHaveTextContent(/^2\/9/);
    expect(celdas[1]).not.toHaveTextContent("BLUE");
    expect(celdas[2]).toHaveTextContent("BLUE Ayb Rest Veracruz");
    expect(celdas[2]).not.toHaveTextContent("2/9");
    // El lector de pantalla oye la posición completa, no solo «2/9».
    expect(celdas[1]).toHaveTextContent("Orden de trabajo 2 de 9");
  });

  it("no repite el pedido en cada fila cuando es el mismo en todas las OT de la OV", () => {
    render(
      <EstadoFotosTabla
        filas={[
          fila({ ot: { numero: 1, total: 9, almacen: "A", pedido: "4501", pedidoVaria: false } }),
        ]}
      />,
    );

    expect(screen.queryByText(/Pedido 4501/)).not.toBeInTheDocument();
  });

  it("muestra el pedido debajo del centro de consumo solo cuando cambia entre las OT de la OV", () => {
    render(
      <EstadoFotosTabla
        filas={[
          fila({ ot: { numero: 1, total: 2, almacen: "A", pedido: "4501", pedidoVaria: true } }),
        ]}
      />,
    );

    expect(screen.getByText("Pedido 4501")).toBeInTheDocument();
  });

  it("sin centro de consumo el pedido sí se muestra, para que la OT no quede sin nombre", () => {
    render(<EstadoFotosTabla filas={[fila({ idOrdenTrabajo: "pedido:4501|almacen:_" })]} />);

    expect(screen.getByText("Pedido 4501")).toBeInTheDocument();
  });

  it("sin posición (la OV ya no tiene esa OT) solo muestra el nombre, sin inventar un número", () => {
    render(<EstadoFotosTabla filas={[fila({ ot: null })]} />);

    expect(within(screen.getAllByRole("row")[1]).queryByText(/^\d+\/\d+/)).not.toBeInTheDocument();
  });

  it("una captura de toda la OV (sin clave de OT) dice «Toda la orden»", () => {
    render(<EstadoFotosTabla filas={[fila({ idOrdenTrabajo: "" })]} />);

    expect(within(screen.getAllByRole("row")[1]).getByText("Toda la orden")).toBeInTheDocument();
  });

  it("en un fallo muestra el motivo en la misma fila, sin el código interno del error", () => {
    render(
      <EstadoFotosTabla
        filas={[
          fila({
            estado: "fallo",
            mensajeError: "La IA no respondió a tiempo.",
            numeroIntento: 2,
          }),
        ]}
      />,
    );

    const fila1 = screen.getAllByRole("row")[1];
    expect(within(fila1).getByText("Falló")).toBeInTheDocument();
    expect(within(fila1).getByText(/La IA no respondió a tiempo\./)).toBeInTheDocument();
    // Nada entre paréntesis: ningún código interno junto al mensaje.
    expect(fila1).not.toHaveTextContent("(");
  });

  it("una foto colgada se ve como «Colgada», no como «Procesando»", () => {
    render(<EstadoFotosTabla filas={[fila({ estado: "procesando", colgada: true })]} />);

    const fila1 = screen.getAllByRole("row")[1];
    expect(within(fila1).getByText("Colgada")).toBeInTheDocument();
    expect(within(fila1).queryByText("Procesando")).not.toBeInTheDocument();
  });

  it("sin foto, sin tiempo y sin OV muestra rayas en vez de vacío", () => {
    render(
      <EstadoFotosTabla
        filas={[
          fila({
            estado: "recibida",
            urlFoto: null,
            codigoOv: null,
            tiempoTotalMs: null,
          }),
        ]}
      />,
    );

    const fila1 = screen.getAllByRole("row")[1];
    expect(within(fila1).queryByRole("link")).not.toBeInTheDocument();
    expect(within(fila1).getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });
});
