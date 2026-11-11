import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

const listOrdenes = vi.fn();
const cargarHojas = vi.fn();
const buildBlob = vi.fn();
const imprimirPdf = vi.fn();
const postLog = vi.fn();
const fetchLog = vi.fn();
const espiaDetallada = vi.fn();

vi.mock("@/components/shared/module/OperationalModuleShell", () => ({
  OperationalModuleShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
vi.mock("@/modules/admin-panel/shared/hooks/useAdminMaestroScope", () => ({
  useAdminMaestroScope: () => ({
    codigoCuenta: "JBR",
    inspect: false,
    runScoped: <T,>(fn: () => Promise<T>) => fn(),
  }),
}));
vi.mock("@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria", () => ({
  useCuentaZonaHoraria: () => "America/Bogota",
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ session: { nombre: "Dani", idUsuario: "u1" } }) },
}));
vi.mock("../../shared/services/sales.service", () => ({
  listOrdenesVentaOperador: (...args: unknown[]) => listOrdenes(...args),
}));
vi.mock("./cargar-hojas-batch", () => ({
  cargarHojasBatch: (...args: unknown[]) => cargarHojas(...args),
  cargarCentrosConsumo: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/modules/configurator/impresoras/services/impresoras.service", () => ({
  getImpresoraActivaCuenta: () => Promise.resolve({ nombre: "Brother cocina" }),
}));
vi.mock("../print/download-orden-tarea-almacen-pdf", () => ({
  buildOrdenTareaAlmacenLandscapePdfBlob: (...args: unknown[]) => buildBlob(...args),
  printOrdenTareaAlmacenLandscape: (...args: unknown[]) => imprimirPdf(...args),
}));
vi.mock("../services/orden-venta-log.client", () => ({
  postOrdenVentaLogForOts: (...args: unknown[]) => postLog(...args),
  fetchOrdenVentaLog: (...args: unknown[]) => fetchLog(...args),
}));
// El paquete con OC se prueba aparte (armar-previa-detallada.test.ts): aquí solo se mira qué se le pide.
vi.mock("./armar-previa-detallada", async (importarOriginal) => {
  const real = await importarOriginal<typeof import("./armar-previa-detallada")>();
  return {
    armarPreviaDetallada: (...args: Parameters<typeof real.armarPreviaDetallada>) =>
      (espiaDetallada(...args) as ReturnType<typeof real.armarPreviaDetallada> | undefined) ?? real.armarPreviaDetallada(...args),
  };
});

import { ImpresionBatchPageContent } from "./ImpresionBatchPageContent";

function ov(id: string, extra: Partial<OrdenVentaOperadorRow> = {}): OrdenVentaOperadorRow {
  return {
    idOrdenVenta: id,
    venta: `OV-${id}`,
    occ: "",
    occTodas: [],
    cuenta: "JBR",
    comprador: "Hotel Sol",
    productos: "—",
    cantidadKg: 0,
    total: 0,
    estado: "confirmada",
    fecha: "2026-11-01",
    fechaEntrega: "2026-11-06",
    ordenesTrabajo: 1,
    destino: "—",
    idBodega: "b1",
    idBodegaDestino: null,
    slaStatus: "en_tiempo",
    alertaStatus: "ok",
    minutosEnEstado: 0,
    slaMinutos: 60,
    alertaMinutos: 45,
    ...extra,
  };
}

const HOJA = { idOrdenVenta: "a", idOrdenTrabajo: "ot-1", tareaIndex: 1 } as OrdenTareaAlmacenPrintData;

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:batch");
  URL.revokeObjectURL = vi.fn();
  listOrdenes.mockResolvedValue([
    ov("a"),
    ov("b", { comprador: "Hotel Luna", ordenesTrabajo: 2 }),
    ov("x", { estado: "cancelada" }),
    ov("p", { estado: "por_confirmar" }),
    ov("l", { estado: "alistamiento" }),
    ov("d", { estado: "alistada" }),
    ov("z", { estado: "despachada" }),
  ]);
  cargarHojas.mockResolvedValue([HOJA]);
  buildBlob.mockResolvedValue({ blob: new Blob(["%PDF"]), filename: "x.pdf" });
  imprimirPdf.mockResolvedValue({ queue: { kind: "printing" }, impresora: "Brother" });
});

describe("ImpresionBatchPageContent", () => {
  it("el título de la pantalla es «Impresión detallada», como la opción del sidebar", () => {
    render(<ImpresionBatchPageContent />);

    expect(screen.getByRole("heading", { name: "Impresión detallada" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Impresión en grupo" })).not.toBeInTheDocument();
  });

  it("lista solo las OV confirmadas o en alistamiento", async () => {
    render(<ImpresionBatchPageContent />);
    expect(await screen.findByText("OV-a")).toBeInTheDocument();
    expect(screen.getByText("OV-b")).toBeInTheDocument();
    expect(screen.getByText("OV-l")).toBeInTheDocument();
    for (const fuera of ["OV-x", "OV-p", "OV-d", "OV-z"]) {
      expect(screen.queryByText(fuera)).toBeNull();
    }
    expect(screen.getByRole("button", { name: "Ver vista previa" })).toBeDisabled();
  });

  it("filtra por cliente y marca solo las visibles", async () => {
    render(<ImpresionBatchPageContent />);
    await screen.findByText("OV-a");
    await userEvent.selectOptions(screen.getByLabelText("Cliente"), "Hotel Luna");
    expect(screen.queryByText("OV-a")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Marcar las 1 visibles" }));
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent("2 OT de 1 OV");
  });

  it("arma la vista previa solo con lo elegido y pide confirmar antes de imprimir", async () => {
    render(<ImpresionBatchPageContent />);
    await screen.findByText("OV-a");
    await userEvent.click(screen.getByLabelText("Seleccionar OV-a, Hotel Sol"));
    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));

    await screen.findByRole("region", { name: "Vista previa de la impresión" });
    expect(cargarHojas.mock.calls[0]![0].resumen).toHaveLength(1);
    expect(cargarHojas.mock.calls[0]![0].resumen[0].ots).toEqual([1]);

    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    const dialogo = await screen.findByText("¿Imprimir esta selección?");
    expect(dialogo).toBeInTheDocument();
    expect(imprimirPdf).not.toHaveBeenCalled();
  });

  it("al confirmar imprime, registra el log por OV y vuelve a la selección con aviso", async () => {
    render(<ImpresionBatchPageContent />);
    await screen.findByText("OV-a");
    await userEvent.click(screen.getByLabelText("Seleccionar OV-a, Hotel Sol"));
    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));
    await screen.findByRole("region", { name: "Vista previa de la impresión" });
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    const confirmar = await screen.findByText("¿Imprimir esta selección?");
    const panel = confirmar.closest("[role='dialog'], div")!.parentElement!;
    await userEvent.click(within(panel).getAllByRole("button", { name: "Imprimir" }).at(-1)!);

    await waitFor(() => expect(imprimirPdf).toHaveBeenCalledTimes(1));
    expect(postLog).toHaveBeenCalledTimes(1);
    expect(postLog.mock.calls[0]![0]).toMatchObject({
      idOrdenVenta: "a",
      idOrdenesTrabajo: ["ot-1"],
    });
    await screen.findByText("Nada seleccionado");
  });

  it("si no se puede leer una OV muestra el error y se queda en la selección", async () => {
    cargarHojas.mockRejectedValueOnce(new Error("No se pudo leer OV-a. Inténtalo de nuevo."));
    render(<ImpresionBatchPageContent />);
    await screen.findByText("OV-a");
    await userEvent.click(screen.getByLabelText("Seleccionar OV-a, Hotel Sol"));
    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo leer OV-a");
    expect(screen.queryByRole("region", { name: "Vista previa de la impresión" })).toBeNull();
  });
});

describe("ImpresionBatchPageContent: reimprimir lo ya impreso (REQ-298)", () => {
  beforeEach(() => {
    // Solo la OV «a» tiene una impresión en su registro.
    fetchLog.mockImplementation(async ({ idOrdenVenta }: { idOrdenVenta: string }) =>
      idOrdenVenta === "a" ? [{ payloadTipo: "impresion_pdf" }] : [],
    );
  });

  it("al nacer muestra todas las órdenes y no lee ningún registro de impresiones", async () => {
    render(<ImpresionBatchPageContent />);

    await screen.findByText("OV-a");

    expect(screen.getByRole("button", { name: "Todas las órdenes (3)" })).toHaveAttribute("aria-pressed", "true");
    expect(fetchLog).not.toHaveBeenCalled();
  });

  it("«Sin imprimir» quita las que ya se imprimieron y «Ya impresas» deja solo esas", async () => {
    render(<ImpresionBatchPageContent />);
    await screen.findByText("OV-a");

    await userEvent.click(screen.getByRole("button", { name: /^Sin imprimir/ }));

    await waitFor(() => expect(screen.queryByText("OV-a")).toBeNull());
    expect(screen.getByText("OV-b")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sin imprimir (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ya impresas (1)" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ya impresas (1)" }));

    expect(await screen.findByText("OV-a")).toBeInTheDocument();
    expect(screen.queryByText("OV-b")).toBeNull();
    expect(fetchLog).toHaveBeenCalledTimes(3);
  });

  it("volver a «Todas las órdenes» trae de vuelta todas, sin leer otra vez el registro", async () => {
    render(<ImpresionBatchPageContent />);
    await screen.findByText("OV-a");
    await userEvent.click(screen.getByRole("button", { name: /^Ya impresas/ }));
    await waitFor(() => expect(screen.queryByText("OV-b")).toBeNull());

    await userEvent.click(screen.getByRole("button", { name: /^Todas las órdenes/ }));

    expect(await screen.findByText("OV-b")).toBeInTheDocument();
    expect(screen.getByText("OV-a")).toBeInTheDocument();
    expect(fetchLog).toHaveBeenCalledTimes(3);
  });
});

describe("ImpresionBatchPageContent: órdenes de compra originales (REQ-298)", () => {
  async function elegirOcYVerVistaPrevia() {
    await screen.findByText("OV-a");
    await userEvent.click(screen.getByRole("button", { name: /Tipo de documentos/ }));
    await userEvent.click(screen.getByRole("option", { name: "Órdenes de compra originales" }));
    await userEvent.click(screen.getByLabelText("Seleccionar OV-a, Hotel Sol"));
    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));
  }

  it("arranca solo con órdenes de tarea y arma la vista previa sin pedir los adjuntos", async () => {
    render(<ImpresionBatchPageContent />);
    await screen.findByText("OV-a");
    expect(screen.getByRole("button", { name: /Tipo de documentos/ })).toHaveTextContent("Órdenes de tarea");
    await userEvent.click(screen.getByLabelText("Seleccionar OV-a, Hotel Sol"));

    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));

    await screen.findByRole("region", { name: "Vista previa de la impresión" });
    expect(cargarHojas.mock.calls[0]![0].alLeerDetalle).toBeUndefined();
    expect(espiaDetallada.mock.calls[0]![0].conOc).toBe(false);
  });

  it("al marcar las OC recoge los adjuntos de cada OV y arma el paquete con ellas", async () => {
    cargarHojas.mockImplementation(async (entrada: { alLeerDetalle?: (id: string, origen: string | null) => void }) => {
      entrada.alLeerDetalle?.("a", '[{"nombre":"pedido.pdf"}]');
      return [HOJA];
    });
    espiaDetallada.mockResolvedValueOnce({
      blob: new Blob(["%PDF"]),
      hojas: [HOJA],
      resumen: [{ row: ov("a"), ots: [1] }],
      nombreArchivo: "x.pdf",
    });
    render(<ImpresionBatchPageContent />);

    await elegirOcYVerVistaPrevia();

    await screen.findByRole("region", { name: "Vista previa de la impresión" });
    const entrada = espiaDetallada.mock.calls[0]![0];
    expect(entrada.conOc).toBe(true);
    expect(entrada.origenPorOv.get("a")).toBe('[{"nombre":"pedido.pdf"}]');
  });

  it("sin «Órdenes de tarea» no deja armar la vista previa y dice qué hacer", async () => {
    render(<ImpresionBatchPageContent />);
    await screen.findByText("OV-a");
    await userEvent.click(screen.getByRole("button", { name: /Tipo de documentos/ }));
    await userEvent.click(screen.getByRole("option", { name: "Órdenes de tarea" }));
    await userEvent.click(screen.getByLabelText("Seleccionar OV-a, Hotel Sol"));

    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Elige «Órdenes de tarea»");
    expect(cargarHojas).not.toHaveBeenCalled();
  });
});
