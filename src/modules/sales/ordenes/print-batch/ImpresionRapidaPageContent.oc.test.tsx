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
const armarConOc = vi.fn();
const imprimirListo = vi.fn();

vi.mock("@/components/shared/module/OperationalModuleShell", () => ({
  OperationalModuleShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
vi.mock("@/modules/admin-panel/shared/hooks/useAdminMaestroScope", () => ({
  useAdminMaestroScope: () => ({ codigoCuenta: "JBR", inspect: false, runScoped: <T,>(fn: () => Promise<T>) => fn() }),
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
vi.mock("./armar-paquete-con-oc", async (importarOriginal) => ({
  ...(await importarOriginal<object>()),
  armarPaqueteConOc: (...args: unknown[]) => armarConOc(...args),
}));
vi.mock("../print/numerar-hojas-pdf", () => ({
  // La numeración se prueba aparte; aquí el PDF falso de la vista previa pasa tal cual.
  numerarBlobPdf: async (blob: Blob) => blob,
}));
vi.mock("./imprimir-pdf-listo", () => ({
  imprimirPdfListo: (...args: unknown[]) => imprimirListo(...args),
}));
vi.mock("./ya-impresas", () => ({
  idsOvYaImpresas: vi.fn().mockResolvedValue(new Set()),
}));
vi.mock("@/modules/configurator/impresoras/services/impresoras.service", () => ({
  // IPP encola por su cuenta: sin pausa entre envíos, para no depender de temporizadores.
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

function ov(id: string, fechaEntrega: string): OrdenVentaOperadorRow {
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
    fechaEntrega,
    ordenesTrabajo: 1,
    destino: "—",
    idBodega: "b1",
    idBodegaDestino: null,
    slaStatus: "en_tiempo",
    alertaStatus: "ok",
    minutosEnEstado: 0,
    slaMinutos: 60,
    alertaMinutos: 45,
  };
}

// Una hoja por OV, en el orden en que las devuelve la lectura (el de impresión).
const HOJAS = [
  { idOrdenVenta: "viejo", idOrdenTrabajo: "ot-1", tareaIndex: 1 },
  { idOrdenVenta: "nuevo", idOrdenTrabajo: "ot-2", tareaIndex: 1 },
] as OrdenTareaAlmacenPrintData[];

async function prepararImpresion() {
  // La rápida imprime una fecha exacta: se elige la de los datos de prueba.
  const campo = screen.getByRole("textbox", { name: /Imprimir con entrega exactamente en esta fecha/ });
  await userEvent.clear(campo);
  await userEvent.type(campo, "10/01/2026{Enter}");
  await userEvent.click(screen.getByRole("button", { name: "Preparar impresión" }));
  await screen.findByRole("region", { name: "Vista previa de la impresión" });
}

async function marcarOc() {
  await userEvent.click(screen.getByRole("button", { name: /Tipo de documentos/ }));
  await userEvent.click(screen.getByRole("option", { name: "Órdenes de compra originales" }));
  await userEvent.keyboard("{Escape}");
}

async function confirmarEnvio(hojas: number) {
  await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
  await screen.findByText("¿Imprimir esta selección?");
  await userEvent.click(screen.getAllByRole("button", { name: "Imprimir" }).at(-1)!);
  await userEvent.click(await screen.findByRole("button", { name: `Sí, imprimir ${hojas} hojas` }));
}

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:rapida");
  URL.revokeObjectURL = vi.fn();
  listOrdenes.mockResolvedValue([ov("viejo", "2026-01-10"), ov("nuevo", "2026-01-10"), ov("otrodia", "2026-01-12")]);
  buildBlob.mockResolvedValue({ blob: new Blob(["%PDF"]), filename: "x.pdf" });
  cargarHojas.mockImplementation(async (entrada: { alLeerDetalle?: (id: string, origen: string | null) => void }) => {
    entrada.alLeerDetalle?.("viejo", '[{"nombre":"pedido.pdf"}]');
    entrada.alLeerDetalle?.("nuevo", null);
    return HOJAS;
  });
  // Dos envíos, uno por OV: el primero lleva 3 páginas de OC y el segundo ninguna.
  armarConOc.mockImplementation(async (datos: { hojas: unknown[]; resumen: Array<{ row: unknown }> }) => ({
    partes: datos.resumen.map((item, i) => ({
      hojas: [datos.hojas[i]],
      resumen: [item],
      paginasExtra: i === 0 ? 3 : 0,
      pdf: new Blob([`envío ${i + 1}`]),
    })),
    resumenPdf: { titulo: "Resumen de impresión", subtitulo: "x", generado: "y", filas: [] },
  }));
  imprimirListo.mockResolvedValue({ queue: { kind: "printing" }, impresora: "Brother", via: "ipp" });
});

describe("ImpresionRapidaPageContent: con las órdenes de compra originales (REQ-260)", () => {
  it("sin marcar las OC no baja ningún adjunto ni usa el paquete con OC", async () => {
    render(<ImpresionRapidaPageContent />);

    await prepararImpresion();

    expect(cargarHojas.mock.calls[0]![0].alLeerDetalle).toBeUndefined();
    expect(armarConOc).not.toHaveBeenCalled();
  });

  it("al marcarlas recoge los adjuntos de cada OV al leer su detalle y arma el paquete con ellos", async () => {
    render(<ImpresionRapidaPageContent />);
    await marcarOc();

    await prepararImpresion();

    expect(cargarHojas.mock.calls[0]![0].alLeerDetalle).toBeTypeOf("function");
    const datos = armarConOc.mock.calls[0]![0];
    expect(datos.origenPorOv.get("viejo")).toBe('[{"nombre":"pedido.pdf"}]');
    expect(datos.origenPorOv.get("nuevo")).toBeNull();
    expect(datos.resumen.map((item: { row: { idOrdenVenta: string } }) => item.row.idOrdenVenta)).toEqual(["viejo", "nuevo"]);
    // La vista previa dice qué trae y que es el primer envío.
    expect(screen.getByText(/con sus órdenes de compra detrás/)).toBeInTheDocument();
    expect(screen.getByText(/vista previa del envío 1 de 2/)).toBeInTheDocument();
  });

  it("la confirmación cuenta las hojas de verdad: OT, resumen y páginas de OC", async () => {
    render(<ImpresionRapidaPageContent />);
    await marcarOc();
    await prepararImpresion();

    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    await screen.findByText("¿Imprimir esta selección?");
    await userEvent.click(screen.getAllByRole("button", { name: "Imprimir" }).at(-1)!);

    // 2 hojas de OT + 1 del resumen + 3 de OC.
    expect(await screen.findByText("¿Seguro que quieres imprimir 6 hojas?")).toBeInTheDocument();
  });

  it("envía el PDF ya armado de cada parte, no el de las hojas, y registra el log de cada OV", async () => {
    render(<ImpresionRapidaPageContent />);
    await marcarOc();
    await prepararImpresion();

    await confirmarEnvio(6);

    await waitFor(() => expect(imprimirListo).toHaveBeenCalledTimes(2));
    expect(imprimirPdf).not.toHaveBeenCalled();
    expect(imprimirListo.mock.calls.map((c) => c[1].nombreTrabajo)).toEqual(["OV OV-viejo (1/2)", "OV OV-nuevo (2/2)"]);
    expect(postLog.mock.calls.map((c) => c[0].idOrdenVenta)).toEqual(["viejo", "nuevo"]);
  });

  it("avisa arriba de la vista previa qué OV salen sin OC, y sin OC marcadas no avisa", async () => {
    armarConOc.mockImplementation(async (datos: { hojas: unknown[]; resumen: Array<{ row: unknown }> }) => ({
      partes: datos.resumen.map((item, i) => ({ hojas: [datos.hojas[i]], resumen: [item], paginasExtra: 0, pdf: new Blob(["x"]) })),
      resumenPdf: {
        titulo: "Resumen de impresión",
        subtitulo: "x",
        generado: "y",
        filas: [
          { venta: "OV-viejo", cliente: "Hotel Sol", entrega: "10/01/2026", ot: 1, hojas: 1, oc: 2 },
          { venta: "OV-nuevo", cliente: "Hotel Sol", entrega: "12/01/2026", ot: 1, hojas: 1 },
        ],
        notas: ["OV-nuevo: no tiene OC para imprimir (adjuntos HTML, PDF o Excel)."],
      },
    }));
    render(<ImpresionRapidaPageContent />);
    await marcarOc();

    await prepararImpresion();

    expect(screen.getByText("1 de 2 OV no tiene OC para imprimir.")).toBeInTheDocument();
    expect(screen.getByText(/OV-nuevo\. Sus órdenes de tarea sí salen\./)).toBeInTheDocument();
  });

  it("sin marcar las OC no hay aviso de OC", async () => {
    render(<ImpresionRapidaPageContent />);

    await prepararImpresion();

    expect(screen.queryByText(/no tienen? OC para imprimir/)).not.toBeInTheDocument();
  });

  it("si falla armar el paquete con OC lo dice y se queda en la pantalla de la fecha", async () => {
    armarConOc.mockRejectedValue(new Error("No se pudo armar el PDF."));
    render(<ImpresionRapidaPageContent />);
    await marcarOc();
    const campo = screen.getByRole("textbox", { name: /Imprimir con entrega exactamente en esta fecha/ });
    await userEvent.clear(campo);
    await userEvent.type(campo, "10/01/2026{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Preparar impresión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo armar el PDF.");
    expect(screen.getByRole("button", { name: "Preparar impresión" })).toBeEnabled();
  });
});
