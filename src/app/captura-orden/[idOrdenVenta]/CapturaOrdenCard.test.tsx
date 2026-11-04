import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CapturaOrdenCard } from "./CapturaOrdenCard";
import { CAPTURA_BUSY_PHRASES, CAPTURA_DONE_PHRASE } from "./captura-busy-phrases";

// El formulario de subida tiene sus propias pruebas: aquí solo importa lo que la tarjeta muestra.
vi.mock("./CapturaOrdenUploadForm", () => ({
  CapturaOrdenUploadForm: (props: {
    onUploadingChange?: (uploading: boolean) => void;
    onUploadOk?: () => void;
  }) => (
    <div>
      <button type="button" onClick={() => props.onUploadingChange?.(true)}>
        simular subida
      </button>
      <button
        type="button"
        onClick={() => {
          props.onUploadingChange?.(true);
          props.onUploadOk?.();
        }}
      >
        simular subida terminada
      </button>
    </div>
  ),
}));

const META = {
  idOrdenVenta: "ov-1",
  folio: "OV-00001",
  idOrdenTrabajo: "ot-1",
  tieneCaptura: false,
  capturaActualizadaEn: null,
};

function tarjeta() {
  return render(
    <CapturaOrdenCard
      idOrdenVenta="ov-1"
      idOrdenTrabajo="ot-1"
      meta={META}
      flashOk={false}
      flashError={null}
    />,
  );
}

describe("CapturaOrdenCard — espera con Polo", () => {
  it("antes de subir no muestra espera, solo el folio", () => {
    tarjeta();

    expect(screen.getByText("OV-00001")).toBeInTheDocument();
    expect(screen.queryByText(/puede tardar/i)).not.toBeInTheDocument();
  });

  it("al subir muestra la frase en curso y cuánto suele tardar, sin la marca de Mateo", async () => {
    const user = userEvent.setup();
    tarjeta();

    await user.click(screen.getByRole("button", { name: "simular subida" }));

    const estado = screen.getByRole("status");
    expect(estado).toHaveTextContent(CAPTURA_BUSY_PHRASES[0]);
    expect(estado).toHaveTextContent("Este proceso puede tardar entre 5 y 30 segundos.");
    expect(screen.queryByText("Mateo IA")).not.toBeInTheDocument();
  });

  it("al terminar de subir dice «Listo» y ya no promete una espera", async () => {
    const user = userEvent.setup();
    tarjeta();

    await user.click(screen.getByRole("button", { name: "simular subida terminada" }));

    const estado = screen.getByRole("status");
    expect(estado).toHaveTextContent(CAPTURA_DONE_PHRASE);
    expect(estado).not.toHaveTextContent(/puede tardar/i);
  });
});
