import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CapturaOrdenPublicPage from "./page";

const servicio = vi.hoisted(() => ({
  getOrdenMetaPublica: vi.fn(),
  getOrdenSurtidoCaptura: vi.fn(),
  buildPrintDataAdmin: vi.fn(),
}));

vi.mock("@/modules/sales/ordenes/surtido/orden-surtido.service", () => servicio);

const ORDEN = {
  idOrdenVenta: "ov-1",
  codigoCuenta: "1YW43",
  folio: "OV-00000011",
  tieneCaptura: false,
  idOrdenTrabajo: "",
};

async function abrirPagina(
  opciones: { ot?: string; captura?: string; msg?: string; id?: string } = {},
) {
  const searchParams: Record<string, string> = {};
  if (opciones.ot) searchParams.ot = opciones.ot;
  if (opciones.captura) searchParams.captura = opciones.captura;
  if (opciones.msg) searchParams.msg = opciones.msg;

  const pagina = await CapturaOrdenPublicPage({
    params: Promise.resolve({ idOrdenVenta: opciones.id ?? "ov-1" }),
    searchParams: Promise.resolve(searchParams),
  });
  return render(pagina);
}

describe("CapturaOrdenPublicPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
    servicio.getOrdenMetaPublica.mockResolvedValue(ORDEN);
    servicio.getOrdenSurtidoCaptura.mockResolvedValue(null);
    servicio.buildPrintDataAdmin.mockResolvedValue({
      tareaIndex: 2,
      tareaTotal: 9,
      centroConsumo: "BLUE Ayb Xc Cena Gran Tlachco",
    });
  });

  it("muestra a qué hoja corresponde la foto: folio, OT y centro de consumo", async () => {
    await abrirPagina({ ot: "pedido:1|almacen:gran tlachco" });

    expect(screen.getByText("OV-00000011")).toBeInTheDocument();
    expect(screen.getByText("OT 2/9")).toBeInTheDocument();
    expect(screen.getByText("BLUE Ayb Xc Cena Gran Tlachco")).toBeInTheDocument();
    expect(servicio.buildPrintDataAdmin).toHaveBeenCalledWith(
      "ov-1",
      expect.stringContaining("gran tlachco"),
    );
  });

  it("si no se puede leer la hoja, la pantalla se ve igual, solo con el folio", async () => {
    servicio.buildPrintDataAdmin.mockRejectedValue(new Error("sin conexión"));

    await abrirPagina();

    expect(screen.getByText("OV-00000011")).toBeInTheDocument();
    expect(screen.queryByText(/^OT \d/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tomar foto")).toBeInTheDocument();
  });

  it("una orden inexistente avisa y no ofrece tomar la foto", async () => {
    servicio.getOrdenMetaPublica.mockResolvedValue(null);

    await abrirPagina();

    expect(screen.getByRole("alert")).toHaveTextContent("Orden no encontrada.");
    expect(screen.queryByLabelText("Tomar foto")).not.toBeInTheDocument();
    expect(servicio.buildPrintDataAdmin).not.toHaveBeenCalled();
  });

  it("si falla la lectura de la orden, muestra el motivo", async () => {
    servicio.getOrdenMetaPublica.mockRejectedValue(new Error("Supabase caído"));

    await abrirPagina();

    expect(screen.getByRole("alert")).toHaveTextContent("Supabase caído");
  });

  it("un enlace sin id de orden es inválido", async () => {
    await abrirPagina({ id: " " });

    expect(screen.getByRole("alert")).toHaveTextContent("Enlace inválido.");
    expect(servicio.getOrdenMetaPublica).not.toHaveBeenCalled();
  });

  it("sin JavaScript, el resultado que vuelve por la URL se muestra", async () => {
    await abrirPagina({ captura: "ok" });

    expect(screen.getByRole("status")).toHaveTextContent("Listo");
  });
});
