import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CapturaOrdenCard } from "./CapturaOrdenCard";
import type { CapturaOrdenMetaView } from "./captura-orden.types";
import { CAPTURA_BUSY_PHRASES, CAPTURA_DONE_PHRASE } from "./captura-busy-phrases";
import { registrarCaptura } from "./captura-sesion";

// El formulario de subida tiene sus propias pruebas: aquí solo importa lo que la tarjeta muestra.
vi.mock("./CapturaOrdenUploadForm", () => ({
  CapturaOrdenUploadForm: (props: {
    idIntentoReintento?: string | null;
    onFilePicked?: () => void;
    onReceived?: (idIntento: string) => void;
    onUploadingChange?: (uploading: boolean) => void;
    onUploadOk?: () => void;
    onUploadError?: (message: string) => void;
  }) => (
    <div data-reintento={props.idIntentoReintento ?? ""}>
      <button
        type="button"
        onClick={() => {
          props.onFilePicked?.();
          props.onUploadingChange?.(true);
        }}
      >
        simular envío
      </button>
      <button type="button" onClick={() => props.onReceived?.("id-1")}>
        simular recibida
      </button>
      <button type="button" onClick={() => props.onUploadOk?.()}>
        simular respuesta síncrona
      </button>
      <button
        type="button"
        onClick={() => {
          props.onFilePicked?.();
          props.onUploadError?.("Error de red al subir.");
        }}
      >
        simular envío fallido
      </button>
    </div>
  ),
}));

// El seguimiento hace peticiones reales; se prueba aparte. Aquí se simula su efecto sobre el registro.
vi.mock("./useSeguimientoCaptura", () => ({ useSeguimientoCaptura: vi.fn() }));

const META: CapturaOrdenMetaView = {
  idOrdenVenta: "ov-1",
  folio: "OV-00001",
  idOrdenTrabajo: "ot-1",
  tieneCaptura: false,
  capturaActualizadaEn: null,
};

function tarjeta(
  props: {
    flashOk?: boolean;
    flashError?: string | null;
    ordenTrabajo?: CapturaOrdenMetaView["ordenTrabajo"];
  } = {},
) {
  return render(
    <CapturaOrdenCard
      idOrdenVenta="ov-1"
      idOrdenTrabajo="ot-1"
      meta={{ ...META, ordenTrabajo: props.ordenTrabajo }}
      flashOk={props.flashOk ?? false}
      flashError={props.flashError ?? null}
    />,
  );
}

/** Lo que haría el seguimiento al enterarse de cómo terminó el servidor. */
function servidorTermina(estado: "lista" | "fallo", mensaje?: string) {
  act(() => {
    registrarCaptura({
      idOrdenVenta: "ov-1",
      idOrdenTrabajo: "ot-1",
      folio: "OV-00001",
      estado,
      idIntento: "id-1",
      mensaje,
      at: Date.now(),
    });
  });
}

function registroGuardado() {
  return JSON.parse(window.localStorage.getItem("polaria:captura:sesion") ?? "[]") as Array<{
    estado: string;
    idIntento?: string;
    etiqueta?: string;
  }>;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("CapturaOrdenCard — estado de la foto", () => {
  it("antes de enviar no muestra estado, solo el folio", () => {
    tarjeta();

    expect(screen.getByText("OV-00001")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mientras se envía dice «Enviando la foto», sin prometer una espera larga", async () => {
    const user = userEvent.setup();
    tarjeta();

    await user.click(screen.getByRole("button", { name: "simular envío" }));

    const estado = screen.getByRole("status");
    expect(estado).toHaveTextContent("Enviando la foto");
    expect(estado).not.toHaveTextContent(/puede tardar/i);
  });

  it("al quedar recibida muestra la frase en curso y cuánto suele tardar, sin la marca de Mateo", async () => {
    const user = userEvent.setup();
    tarjeta();

    await user.click(screen.getByRole("button", { name: "simular recibida" }));

    const estado = screen.getByRole("status");
    expect(estado).toHaveTextContent("Foto recibida");
    expect(estado).toHaveTextContent(CAPTURA_BUSY_PHRASES[0]);
    expect(estado).toHaveTextContent("Este proceso puede tardar entre 5 y 30 segundos.");
    expect(estado).toHaveTextContent(/ya puedes tomar otra foto o escanear la siguiente hoja/i);
    expect(screen.queryByText("Mateo IA")).not.toBeInTheDocument();
  });

  it("mientras la foto se procesa el formulario sigue disponible: no tapa la pantalla", async () => {
    const user = userEvent.setup();
    tarjeta();

    await user.click(screen.getByRole("button", { name: "simular recibida" }));

    expect(screen.getByRole("button", { name: "simular envío" })).toBeInTheDocument();
    expect(screen.getByText("OV-00001")).toBeInTheDocument();
  });

  it("al recibirla deja en el registro «procesando» con el id del intento, para seguirla", async () => {
    const user = userEvent.setup();
    tarjeta({ ordenTrabajo: { indice: 3, total: 9, centroConsumo: "Banquetes" } });

    await user.click(screen.getByRole("button", { name: "simular recibida" }));

    expect(registroGuardado()[0]).toMatchObject({
      estado: "procesando",
      idIntento: "id-1",
      etiqueta: "OT 3/9",
    });
  });

  it("cuando el servidor termina bien pasa a «Listo» solo, sin tocar nada", async () => {
    const user = userEvent.setup();
    tarjeta();
    await user.click(screen.getByRole("button", { name: "simular recibida" }));

    servidorTermina("lista");

    const estado = screen.getByRole("status");
    expect(estado).toHaveTextContent(CAPTURA_DONE_PHRASE);
    expect(estado).toHaveTextContent(/escanea su QR/i);
    expect(estado).not.toHaveTextContent(/puede tardar/i);
  });

  it("cuando el servidor falla avisa con el motivo y ofrece reintentar desde la foto guardada", async () => {
    const user = userEvent.setup();
    const { container } = tarjeta();
    await user.click(screen.getByRole("button", { name: "simular recibida" }));
    expect(container.querySelector("[data-reintento]")?.getAttribute("data-reintento")).toBe("");

    servidorTermina("fallo", "La foto fue tomada mal.");

    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("No se subió la foto");
    expect(alerta).toHaveTextContent("La foto fue tomada mal.");
    expect(container.querySelector("[data-reintento]")?.getAttribute("data-reintento")).toBe("id-1");
  });

  it("una respuesta síncrona (servidor antiguo) deja la foto lista de inmediato", async () => {
    const user = userEvent.setup();
    tarjeta();

    await user.click(screen.getByRole("button", { name: "simular respuesta síncrona" }));

    expect(screen.getByRole("status")).toHaveTextContent(CAPTURA_DONE_PHRASE);
    expect(registroGuardado()[0]?.estado).toBe("lista");
  });

  it("si falla el envío (sin red) avisa y NO ofrece reintento del servidor: la foto no llegó", async () => {
    const user = userEvent.setup();
    const { container } = tarjeta();

    await user.click(screen.getByRole("button", { name: "simular envío fallido" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Error de red al subir.");
    expect(container.querySelector("[data-reintento]")?.getAttribute("data-reintento")).toBe("");
    expect(registroGuardado()[0]?.estado).toBe("fallo");
  });

  it("sin JavaScript, el resultado de la URL se sigue mostrando", () => {
    tarjeta({ flashOk: true });

    expect(screen.getByRole("status")).toHaveTextContent(CAPTURA_DONE_PHRASE);
  });
});

describe("CapturaOrdenCard — qué hoja se va a fotografiar", () => {
  it("muestra la OT con su número y el centro de consumo, como en el papel", () => {
    tarjeta({
      ordenTrabajo: { indice: 2, total: 9, centroConsumo: "BLUE Ayb Xc Cena Gran Tlachco" },
    });

    expect(screen.getByText("OV-00001")).toBeInTheDocument();
    expect(screen.getByText("OT 2/9")).toBeInTheDocument();
    expect(screen.getByText("BLUE Ayb Xc Cena Gran Tlachco")).toBeInTheDocument();
  });

  it("si la OV tiene una sola hoja no repite «OT 1/1», pero deja el centro de consumo", () => {
    tarjeta({ ordenTrabajo: { indice: 1, total: 1, centroConsumo: "Almacén general" } });

    expect(screen.queryByText(/^OT \d/)).not.toBeInTheDocument();
    expect(screen.getByText("Almacén general")).toBeInTheDocument();
  });

  it("sin datos de la OT se ve solo el folio, como antes", () => {
    tarjeta();

    expect(screen.getByText("OV-00001")).toBeInTheDocument();
    expect(screen.queryByText(/^OT \d/)).not.toBeInTheDocument();
  });

  it("la lista de otras hojas muestra la OT de cada una y su estado", () => {
    registrarCaptura({
      idOrdenVenta: "ov-1",
      idOrdenTrabajo: "ot-7",
      folio: "OV-00001",
      etiqueta: "OT 7/9",
      estado: "procesando",
      idIntento: "id-7",
      at: Date.now(),
    });
    tarjeta({ ordenTrabajo: { indice: 2, total: 9, centroConsumo: "Gran Tlachco" } });

    expect(screen.getByText("OT 7/9")).toBeInTheDocument();
    expect(screen.getByText("Procesando")).toBeInTheDocument();
  });

  it("una hoja que falló en el servidor es un enlace para repetirla", () => {
    registrarCaptura({
      idOrdenVenta: "ov-2",
      idOrdenTrabajo: "ot-9",
      folio: "OV-00002",
      estado: "fallo",
      at: Date.now(),
    });
    tarjeta();

    expect(screen.getByRole("link", { name: /OV-00002.*no se subió/i })).toHaveAttribute(
      "href",
      "/captura-orden/ov-2?ot=ot-9",
    );
  });
});
