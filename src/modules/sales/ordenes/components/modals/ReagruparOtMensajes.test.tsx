import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ReagruparOtMensajes,
  type ReagruparOtMensajesProps,
} from "./ReagruparOtMensajes";

vi.mock("./OrdenVentaCorreccionCorreoPanel", () => ({
  CargaConPolo: ({
    titulo,
    detalle,
    onCancelar,
  }: {
    titulo: string;
    detalle?: string;
    onCancelar: () => void;
  }) => (
    <div data-testid="carga">
      <span>{titulo}</span>
      {detalle ? <span>{detalle}</span> : null}
      <button type="button" onClick={onCancelar}>
        cancelar-carga
      </button>
    </div>
  ),
}));

const base: ReagruparOtMensajesProps = {
  aviso: null,
  error: null,
  errorCorreccion: null,
  cargando: false,
  interpretando: false,
  leyendoCorreo: false,
  motivoActual: "",
  onCancelarPeticion: () => undefined,
};

describe("ReagruparOtMensajes", () => {
  it("sin nada que mostrar no pinta avisos, errores ni carga", () => {
    render(<ReagruparOtMensajes {...base} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByTestId("carga")).toBeNull();
  });

  it("muestra el aviso como status y los dos errores como alert", () => {
    render(
      <ReagruparOtMensajes
        {...base}
        aviso="Aviso de prueba"
        error="Falló la propuesta"
        errorCorreccion="Falló la corrección"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Aviso de prueba");
    const alertas = screen.getAllByRole("alert");
    expect(alertas.map((a) => a.textContent)).toEqual([
      "Falló la propuesta",
      "Falló la corrección",
    ]);
  });

  it("escapa el texto: nunca se interpreta como HTML", () => {
    render(<ReagruparOtMensajes {...base} error="<b>negrita</b>" />);
    expect(screen.getByRole("alert").textContent).toBe("<b>negrita</b>");
    expect(screen.getByRole("alert").querySelector("b")).toBeNull();
  });

  it.each([
    [{ interpretando: true }, "Entendiendo tu instrucción…"],
    [{ leyendoCorreo: true }, "Releyendo el correo y los archivos…"],
    [{}, "Reorganizando las órdenes de trabajo…"],
  ])("carga con %j → título correcto", (estado, titulo) => {
    render(
      <ReagruparOtMensajes {...base} cargando motivoActual="motivo" {...estado} />,
    );
    expect(screen.getByText(titulo)).toBeInTheDocument();
  });

  it("la capa de carga permite cancelar la petición", async () => {
    const onCancelarPeticion = vi.fn();
    render(
      <ReagruparOtMensajes
        {...base}
        cargando
        onCancelarPeticion={onCancelarPeticion}
      />,
    );
    await userEvent.click(screen.getByText("cancelar-carga"));
    expect(onCancelarPeticion).toHaveBeenCalledTimes(1);
  });
});
