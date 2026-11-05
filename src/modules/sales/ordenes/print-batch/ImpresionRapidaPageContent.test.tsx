import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

const listOrdenes = vi.fn();
const cargarHojas = vi.fn();
const buildBlob = vi.fn();
const imprimirPdf = vi.fn();
const postLog = vi.fn();
const yaImpresas = vi.fn();

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
}));
vi.mock("./ya-impresas", () => ({
  idsOvYaImpresas: (...args: unknown[]) => yaImpresas(...args),
}));
vi.mock("@/modules/configurator/impresoras/services/impresoras.service", () => ({
  // IPP encola por su cuenta: sin pausa entre partes, para no depender de temporizadores en estas pruebas.
  getImpresoraActivaCuenta: () => Promise.resolve({ nombre: "Brother cocina", modoEnvio: "ipp" }),
}));
vi.mock("../print/download-orden-tarea-almacen-pdf", () => ({
  buildOrdenTareaAlmacenLandscapePdfBlob: (...args: unknown[]) => buildBlob(...args),
  printOrdenTareaAlmacenLandscape: (...args: unknown[]) => imprimirPdf(...args),
}));
vi.mock("../services/orden-venta-log.client", () => ({
  postOrdenVentaLogForOts: (...args: unknown[]) => postLog(...args),
}));

import { ImpresionRapidaPageContent } from "./ImpresionRapidaPageContent";

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
    fecha: "2026-01-01",
    fechaEntrega: "2026-01-10",
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

// Una hoja por OV, en el orden en que las devuelve la lectura (el de impresión).
const HOJAS = [
  { idOrdenVenta: "viejo", idOrdenTrabajo: "ot-1", tareaIndex: 1 },
  { idOrdenVenta: "nuevo", idOrdenTrabajo: "ot-2", tareaIndex: 1 },
] as OrdenTareaAlmacenPrintData[];

async function prepararImpresion() {
  await userEvent.click(screen.getByRole("button", { name: "Preparar impresión" }));
  await screen.findByRole("region", { name: "Vista previa de la impresión" });
}

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:rapida");
  URL.revokeObjectURL = vi.fn();
  listOrdenes.mockResolvedValue([
    ov("nuevo", { fechaEntrega: "2026-01-12", ordenesTrabajo: 1 }),
    ov("viejo", { fechaEntrega: "2026-01-10", ordenesTrabajo: 3 }),
    ov("impreso", { fechaEntrega: "2026-01-09" }),
    ov("futuro", { fechaEntrega: "2099-01-01" }),
    ov("alistada", { estado: "alistada" }),
    ov("sinfecha", { fechaEntrega: null }),
  ]);
  yaImpresas.mockResolvedValue(new Set(["impreso"]));
  cargarHojas.mockResolvedValue(HOJAS);
  buildBlob.mockResolvedValue({ blob: new Blob(["%PDF"]), filename: "x.pdf" });
  imprimirPdf.mockResolvedValue({ queue: { kind: "printing" }, impresora: "Brother" });
});

describe("ImpresionRapidaPageContent", () => {
  it("arranca con órdenes de tarea elegidas y no consulta nada hasta que se pide preparar", () => {
    render(<ImpresionRapidaPageContent />);

    expect(screen.getByRole("heading", { name: "Impresión rápida" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tipo de documentos/ })).toHaveTextContent("Órdenes de tarea");
    expect(listOrdenes).not.toHaveBeenCalled();
  });

  it("sin órdenes de tarea elegidas no deja preparar la impresión", async () => {
    render(<ImpresionRapidaPageContent />);

    await userEvent.click(screen.getByRole("button", { name: /Tipo de documentos/ }));
    await userEvent.click(screen.getByRole("option", { name: "Órdenes de tarea" }));

    expect(screen.getByRole("button", { name: /Tipo de documentos/ })).toHaveTextContent("Elige al menos un tipo");
    expect(screen.getByRole("button", { name: "Preparar impresión" })).toBeDisabled();
  });

  it("el resumen no se ofrece en la lista: va siempre", async () => {
    render(<ImpresionRapidaPageContent />);

    await userEvent.click(screen.getByRole("button", { name: /Tipo de documentos/ }));

    expect(screen.queryByRole("option", { name: /Resumen/ })).not.toBeInTheDocument();
  });

  it("el resumen abre el PDF con una fila por OV, en el orden de impresión", async () => {
    render(<ImpresionRapidaPageContent />);

    await prepararImpresion();

    const { resumen } = buildBlob.mock.calls[0]![1];
    expect(resumen.titulo).toBe("Resumen de impresión");
    expect(resumen.subtitulo).toMatch(/^Impresión rápida · entrega hasta \d{2}\/\d{2}\/\d{4}$/);
    expect(resumen.filas.map((f: { venta: string }) => f.venta)).toEqual(["OV-viejo", "OV-nuevo"]);
    expect(resumen.filas[0]).toMatchObject({ cliente: "Hotel Sol", entrega: "10/01/2026", ot: 3 });
  });

  it("la vista previa cuenta la hoja del resumen y dice que va primera", async () => {
    render(<ImpresionRapidaPageContent />);

    await prepararImpresion();

    // 2 hojas de orden de tarea + 1 del resumen.
    expect(screen.getByText(/3 hojas ·.*resumen en la primera hoja/)).toBeInTheDocument();
  });

  it("arma el PDF con lo confirmado y no impreso, en el orden fecha, OT y cliente", async () => {
    render(<ImpresionRapidaPageContent />);

    await prepararImpresion();

    const entrada = cargarHojas.mock.calls[0]![0];
    expect(entrada.orden).toBe("resumen");
    expect(entrada.resumen.map((item: { row: OrdenVentaOperadorRow }) => item.row.idOrdenVenta)).toEqual([
      "viejo",
      "nuevo",
    ]);
    expect(entrada.resumen[0].ots).toEqual([1, 2, 3]);
    // Solo se consulta el log de las candidatas: ni la futura, ni la alistada, ni la sin fecha.
    expect(yaImpresas.mock.calls[0]![0].rows.map((r: OrdenVentaOperadorRow) => r.idOrdenVenta).sort()).toEqual([
      "impreso",
      "nuevo",
      "viejo",
    ]);
  });

  it("pide dos confirmaciones y solo después envía a la impresora y registra el log", async () => {
    render(<ImpresionRapidaPageContent />);
    await prepararImpresion();

    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    await screen.findByText("¿Imprimir esta selección?");
    await userEvent.click(screen.getAllByRole("button", { name: "Imprimir" }).at(-1)!);
    // 2 hojas de orden de tarea + 1 del resumen que abre el PDF.
    await screen.findByText("¿Seguro que quieres imprimir 3 hojas?");
    expect(imprimirPdf).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Sí, imprimir 3 hojas" }));

    await waitFor(() => expect(imprimirPdf).toHaveBeenCalledTimes(1));
    // Se manda el mismo PDF que se vio en la vista previa: con el resumen.
    expect(imprimirPdf.mock.calls[0]![1].resumen.filas).toHaveLength(2);
    expect(postLog).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole("button", { name: "Preparar impresión" })).toBeInTheDocument();
  });

  it("si no hay nada pendiente lo dice y no arma ningún PDF", async () => {
    yaImpresas.mockResolvedValue(new Set(["nuevo", "viejo", "impreso"]));
    render(<ImpresionRapidaPageContent />);

    await userEvent.click(screen.getByRole("button", { name: "Preparar impresión" }));

    expect(await screen.findByText("Nada por imprimir.")).toBeInTheDocument();
    expect(cargarHojas).not.toHaveBeenCalled();
    expect(buildBlob).not.toHaveBeenCalled();
  });

  it("si falla la lectura muestra el error y se queda en la pantalla de la fecha", async () => {
    cargarHojas.mockRejectedValueOnce(new Error("No se pudo leer OV-viejo. Inténtalo de nuevo."));
    render(<ImpresionRapidaPageContent />);

    await userEvent.click(screen.getByRole("button", { name: "Preparar impresión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo leer OV-viejo");
    expect(screen.getByRole("button", { name: "Preparar impresión" })).toBeEnabled();
  });
});

describe("ImpresionRapidaPageContent: paquete grande, en partes de hasta 3 MB", () => {
  // 80 hojas de cada OV: pasan las 150 que siempre caben, así que se mide el peso real.
  const hojasDe = (id: string) =>
    Array.from({ length: 80 }, (_, i) => ({ idOrdenVenta: id, idOrdenTrabajo: `${id}-${i}`, tareaIndex: i + 1 }) as OrdenTareaAlmacenPrintData);

  beforeEach(() => {
    cargarHojas.mockResolvedValue([...hojasDe("viejo"), ...hojasDe("nuevo")]);
    // 3,2 MB entre 160 hojas = 20 KB por hoja: una OV (1,6 MB) llena casi toda una parte (cap. 2,55 MB).
    buildBlob.mockResolvedValue({ blob: new Blob([new Uint8Array(3.2 * 1024 * 1024)]), filename: "x.pdf" });
  });

  async function confirmarEnvio(hojas: number) {
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    await screen.findByText("¿Imprimir esta selección?");
    await userEvent.click(screen.getAllByRole("button", { name: "Imprimir" }).at(-1)!);
    await userEvent.click(await screen.findByRole("button", { name: `Sí, imprimir ${hojas} hojas` }));
  }

  it("mide el peso del paquete, lo parte por OV y avisa en la confirmación", async () => {
    render(<ImpresionRapidaPageContent />);

    await prepararImpresion();
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));

    // Primero se midió con un PDF de prueba sin resumen; después se armó el de la vista previa con él.
    expect(buildBlob).toHaveBeenCalledTimes(2);
    expect(buildBlob.mock.calls[0]![1].resumen).toBeUndefined();
    expect(buildBlob.mock.calls[1]![1].resumen.subtitulo).toContain("en 2 partes");
    expect(buildBlob.mock.calls[1]![1].resumen.filas.map((f: { parte: number }) => f.parte)).toEqual([1, 2]);
    expect(await screen.findByText(/Se mandará en 2 partes\. No cierres esta pestaña/)).toBeInTheDocument();
  });

  it("manda cada parte por separado: el resumen solo en la primera y el log de cada OV con su parte", async () => {
    render(<ImpresionRapidaPageContent />);
    await prepararImpresion();

    await confirmarEnvio(161);

    await waitFor(() => expect(imprimirPdf).toHaveBeenCalledTimes(2));
    const [primera, segunda] = imprimirPdf.mock.calls.map((c) => c[1]);
    expect([primera.etiquetaParte, segunda.etiquetaParte]).toEqual(["1/2", "2/2"]);
    expect(primera.resumen).toBeDefined();
    expect(segunda.resumen).toBeUndefined();
    expect(imprimirPdf.mock.calls.map((c) => c[0].length)).toEqual([80, 80]);
    expect(postLog.mock.calls.map((c) => c[0].idOrdenVenta)).toEqual(["viejo", "nuevo"]);
    expect(await screen.findByText(/Se mandó en 2 partes/)).toBeInTheDocument();
  });

  it("si la segunda parte falla, dice cuántas salieron y al reintentar manda solo esa", async () => {
    imprimirPdf
      .mockResolvedValueOnce({ queue: { kind: "unknown" }, impresora: "Brother" })
      .mockRejectedValueOnce(new Error("SMTP caído"));
    render(<ImpresionRapidaPageContent />);
    await prepararImpresion();

    await confirmarEnvio(161);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Salieron 1 de 2 partes. Falló la parte 2: SMTP caído",
    );
    // Solo la OV de la parte que salió quedó marcada como impresa: la otra se podrá volver a tomar.
    expect(postLog.mock.calls.map((c) => c[0].idOrdenVenta)).toEqual(["viejo"]);

    // Retomar: ya no se manda la primera parte ni el resumen, y las hojas que faltan son 80.
    await confirmarEnvio(80);
    await waitFor(() => expect(imprimirPdf).toHaveBeenCalledTimes(3));
    expect(imprimirPdf.mock.calls[2]![1].etiquetaParte).toBe("2/2");
    expect(imprimirPdf.mock.calls[2]![1].resumen).toBeUndefined();
    expect(postLog.mock.calls.map((c) => c[0].idOrdenVenta)).toEqual(["viejo", "nuevo"]);
  });

  it("con pocas hojas no mide nada y va todo en un solo envío", async () => {
    cargarHojas.mockResolvedValue(HOJAS);
    buildBlob.mockResolvedValue({ blob: new Blob(["%PDF"]), filename: "x.pdf" });
    render(<ImpresionRapidaPageContent />);

    await prepararImpresion();

    expect(buildBlob).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(screen.queryByText(/Se mandará en/)).not.toBeInTheDocument();
  });
});
